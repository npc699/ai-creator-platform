"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Editor as TipTapEditor } from "@tiptap/react";

import { AiGeneratedMark } from "@/components/editor/extensions/ai-generated-mark";
import type { AiGenerateMode } from "@/lib/ai/schema";

type StartAiGenerationInput = {
  mode: AiGenerateMode;
  keyword?: string;
  context?: string;
  insertMode?: "replace" | "append";
};

type AiStreamEvent =
  | {
      type: "delta";
      text: string;
    }
  | {
      type: "done";
    }
  | {
      type: "error";
      message: string;
    };

type AiPendingRange = {
  from: number;
  to: number;
  /** 替换模式下被删掉的原文，撤销时插回该位置。 */
  restoreOnReject?: string;
};

type EditorContextValue = {
  editor: TipTapEditor | null;
  selectedText: string;
  isGenerating: boolean;
  generationError: string | null;
  pendingAiRange: AiPendingRange | null;
  registerEditor: (editor: TipTapEditor | null) => void;
  startGenerate: (input: StartAiGenerationInput) => Promise<boolean>;
  stopGenerate: () => void;
  acceptAiContent: () => void;
  rejectAiContent: () => void;
  insertImage: (src: string, alt?: string) => boolean;
};

const EditorContext = createContext<EditorContextValue | null>(null);

type EditorProviderProps = {
  children: ReactNode;
};

type SelectionSnapshot = {
  from: number;
  to: number;
  text: string;
};

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function parseStreamEvent(line: string): AiStreamEvent | null {
  if (!line.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(line) as AiStreamEvent;
    if (
      parsed.type === "delta" ||
      parsed.type === "done" ||
      parsed.type === "error"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

function buildRequestPayload(
  editor: TipTapEditor,
  input: StartAiGenerationInput,
  selectionSnapshot: SelectionSnapshot | null
): StartAiGenerationInput {
  const selectionText = selectionSnapshot?.text ?? "";

  if (input.mode === "generate") {
    return input;
  }

  return {
    ...input,
    context: input.context?.trim() || selectionText,
  };
}

function usesSelectionMode(input: StartAiGenerationInput) {
  return (
    input.mode === "selection" ||
    input.mode === "polish" ||
    input.mode === "expand" ||
    input.mode === "shrink"
  );
}

function getRestoreTextOnReject(
  input: StartAiGenerationInput,
  selectionSnapshot: SelectionSnapshot | null
) {
  if (!selectionSnapshot || input.insertMode === "append") {
    return undefined;
  }

  if (!usesSelectionMode(input)) {
    return undefined;
  }

  return selectionSnapshot.text;
}

function prepareInsertPosition(
  editor: TipTapEditor,
  input: StartAiGenerationInput,
  selectionSnapshot: SelectionSnapshot | null
) {
  const { from, to } = selectionSnapshot ?? editor.state.selection;
  const hasSelection = from !== to;

  if (usesSelectionMode(input) && hasSelection) {
    if (input.insertMode === "append") {
      editor.chain().focus().setTextSelection(to).run();
      return;
    }

    editor.chain().focus().setTextSelection({ from, to }).deleteSelection().run();
    return;
  }

  editor.chain().focus().run();
}

function deleteDocumentRange(editor: TipTapEditor, range: Pick<AiPendingRange, "from" | "to">) {
  editor
    .chain()
    .focus()
    .setTextSelection({ from: range.from, to: range.to })
    .deleteSelection()
    .run();
}

function rejectAiPendingContent(editor: TipTapEditor, pending: AiPendingRange) {
  const { from, to, restoreOnReject } = pending;

  deleteDocumentRange(editor, { from, to });

  if (!restoreOnReject) {
    return;
  }

  editor.chain().focus().setTextSelection(from).insertContent(restoreOnReject).run();
}

function createAiTextInserter(editor: TipTapEditor, range: AiPendingRange) {
  let pendingNewLines = 0;

  const insertMarkedText = (text: string) => {
    if (!text) {
      return;
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: "text",
        text,
        marks: [{ type: AiGeneratedMark.name }],
      })
      .run();

    range.to = editor.state.selection.to;
  };

  return {
    insert(delta: string) {
      const parts = delta.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split(/(\n+)/);

      for (const part of parts) {
        if (!part) {
          continue;
        }

        if (/^\n+$/.test(part)) {
          pendingNewLines += part.length;
          if (pendingNewLines >= 2) {
            editor.chain().focus().splitBlock().run();
            pendingNewLines = 0;
            range.to = editor.state.selection.to;
          }
          continue;
        }

        if (pendingNewLines === 1) {
          insertMarkedText(" ");
          pendingNewLines = 0;
        }

        insertMarkedText(part);
      }
    },
  };
}

function hasAiContent(range: AiPendingRange) {
  return range.to > range.from;
}

async function readGenerationStream(
  response: Response,
  onEvent: (event: AiStreamEvent) => void
) {
  if (!response.body) {
    throw new Error("AI 生成接口未返回可读流");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const event = parseStreamEvent(line);
        if (event) {
          onEvent(event);
        }
      }
    }

    const rest = parseStreamEvent(buffer);
    if (rest) {
      onEvent(rest);
    }
  } finally {
    reader.releaseLock();
  }
}

async function parseErrorResponse(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || "AI 生成请求失败";
  } catch {
    return "AI 生成请求失败";
  }
}

export function EditorProvider({ children }: EditorProviderProps) {
  const [editor, setEditor] = useState<TipTapEditor | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [pendingAiRange, setPendingAiRange] = useState<AiPendingRange | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const selectionSnapshotRef = useRef<SelectionSnapshot | null>(null);

  const registerEditor = useCallback((nextEditor: TipTapEditor | null) => {
    setEditor(nextEditor);
  }, []);

  const stopGenerate = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
  }, []);

  const rejectPendingAi = useCallback(() => {
    if (!editor || !pendingAiRange) {
      return;
    }

    rejectAiPendingContent(editor, pendingAiRange);
    setPendingAiRange(null);
  }, [editor, pendingAiRange]);

  const acceptAiContent = useCallback(() => {
    if (!editor || !pendingAiRange) {
      return;
    }

    const { from, to } = pendingAiRange;
    const markName = AiGeneratedMark.name;

    if (editor.schema.marks[markName]) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .unsetMark(markName)
        .run();
    } else {
      // 热更新后旧实例可能缺少 mark 扩展，以纯文本重写区间等效于「接收」。
      const plainText = editor.state.doc.textBetween(from, to, "\n\n");
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .deleteSelection()
        .insertContent(plainText)
        .run();
    }

    setPendingAiRange(null);
  }, [editor, pendingAiRange]);

  const rejectAiContent = useCallback(() => {
    rejectPendingAi();
  }, [rejectPendingAi]);

  const insertImage = useCallback(
    (src: string, alt?: string) => {
      if (!editor) {
        return false;
      }

      const trimmedSrc = src.trim();
      if (!trimmedSrc) {
        return false;
      }

      const trimmedAlt = alt?.trim();

      editor
        .chain()
        .focus()
        .setImage({
          src: trimmedSrc,
          ...(trimmedAlt ? { alt: trimmedAlt } : {}),
        })
        .run();

      return true;
    },
    [editor]
  );

  useEffect(() => {
    if (!editor) {
      selectionSnapshotRef.current = null;
      return;
    }

    const syncSelection = () => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, "\n\n").trim();

      if (from === to || !text) {
        selectionSnapshotRef.current = null;
        setSelectedText("");
        return;
      }

      selectionSnapshotRef.current = { from, to, text };
      setSelectedText(text);
    };

    syncSelection();
    editor.on("selectionUpdate", syncSelection);
    editor.on("transaction", syncSelection);

    return () => {
      editor.off("selectionUpdate", syncSelection);
      editor.off("transaction", syncSelection);
    };
  }, [editor]);

  const startGenerate = useCallback(
    async (input: StartAiGenerationInput): Promise<boolean> => {
      if (!editor) {
        setGenerationError("编辑器尚未初始化，请稍后重试");
        return false;
      }

      if (isGenerating) {
        return false;
      }

      const selectionSnapshot = selectionSnapshotRef.current;
      const payload = buildRequestPayload(editor, input, selectionSnapshot);
      const restoreOnReject = getRestoreTextOnReject(input, selectionSnapshot);
      const previousEditable = editor.isEditable;
      const abortController = new AbortController();
      const aiRange: AiPendingRange = { from: 0, to: 0 };
      let succeeded = false;

      if (pendingAiRange) {
        rejectAiPendingContent(editor, pendingAiRange);
        setPendingAiRange(null);
      }

      abortControllerRef.current = abortController;
      setGenerationError(null);
      setIsGenerating(true);

      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(await parseErrorResponse(response));
        }

        prepareInsertPosition(editor, input, selectionSnapshot);
        aiRange.from = editor.state.selection.from;
        aiRange.to = aiRange.from;

        const inserter = createAiTextInserter(editor, aiRange);
        // 生成期间锁定用户输入，避免流式写入时选区被手动移动。
        editor.setEditable(false);

        await readGenerationStream(response, (event) => {
          if (event.type === "delta") {
            inserter.insert(event.text);
            return;
          }

          if (event.type === "error") {
            throw new Error(event.message);
          }
        });

        if (hasAiContent(aiRange)) {
          setPendingAiRange({
            from: aiRange.from,
            to: aiRange.to,
            restoreOnReject,
          });
        }

        succeeded = true;
      } catch (error) {
        if (isAbortError(error)) {
          if (hasAiContent(aiRange)) {
            setPendingAiRange({
              from: aiRange.from,
              to: aiRange.to,
              restoreOnReject,
            });
          }
        } else {
          setGenerationError(
            error instanceof Error ? error.message : "AI 生成失败，请稍后重试"
          );
          if (hasAiContent(aiRange)) {
            rejectAiPendingContent(editor, {
              from: aiRange.from,
              to: aiRange.to,
              restoreOnReject,
            });
          }
        }
      } finally {
        editor.setEditable(previousEditable);
        abortControllerRef.current = null;
        setIsGenerating(false);
      }

      return succeeded;
    },
    [editor, isGenerating, pendingAiRange]
  );

  const value = useMemo<EditorContextValue>(
    () => ({
      editor,
      selectedText,
      isGenerating,
      generationError,
      pendingAiRange,
      registerEditor,
      startGenerate,
      stopGenerate,
      acceptAiContent,
      rejectAiContent,
      insertImage,
    }),
    [
      acceptAiContent,
      editor,
      generationError,
      insertImage,
      isGenerating,
      pendingAiRange,
      registerEditor,
      rejectAiContent,
      selectedText,
      startGenerate,
      stopGenerate,
    ]
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error("useEditorContext 必须在 EditorProvider 内使用");
  }

  return context;
}
