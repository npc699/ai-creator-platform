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
import {
  useDraftAutosave,
  type AutosaveStatus,
  type SaveDraftResult,
} from "@/components/editor/use-draft-autosave";
import { usePostAutosave } from "@/components/editor/use-post-autosave";
import { useNetworkStatus } from "@/components/editor/use-network-status";
import { getLocalDraft, putLocalDraft, clearLocalDraft } from "@/lib/draft-idb";
import {
  pickDraftOnLoadForId,
  type CloudDraftSnapshot,
} from "@/lib/draft-sync";
import type { AiGenerateMode } from "@/lib/ai/schema";
import { canAddPostTag, normalizePostTag } from "@/lib/posts/tags";

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

type EditorMode = "draft" | "post";

type EditorContextValue = {
  editor: TipTapEditor | null;
  editorMode: EditorMode;
  postId: string | null;
  selectedText: string;
  isGenerating: boolean;
  generationError: string | null;
  pendingAiRange: AiPendingRange | null;
  /** 当前登录用户，用于发布后清理本地草稿。 */
  userId: string;
  // Part 3 草稿状态：UI 顶部状态条与恢复横幅都从这里读取。
  title: string;
  setTitle: (value: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  addTag: (raw: string) => { ok: true } | { ok: false; message: string };
  removeTag: (tag: string) => void;
  draftId: string | null;
  hydratedContent: string | null;
  saveStatus: AutosaveStatus;
  lastSavedAt: Date | null;
  isOnline: boolean;
  /** 顶部绿色提示条文案；为 null 时不展示。 */
  noticeBanner: string | null;
  showNoticeBanner: (message: string) => void;
  dismissNoticeBanner: () => void;
  saveDraft: () => Promise<SaveDraftResult>;
  isDirty: () => boolean;
  getEditorContent: () => string;
  isUploadingImage: boolean;
  setImageUploading: (uploading: boolean) => void;
  registerEditor: (editor: TipTapEditor | null) => void;
  startGenerate: (input: StartAiGenerationInput) => Promise<boolean>;
  stopGenerate: () => void;
  acceptAiContent: () => void;
  rejectAiContent: () => void;
  insertImage: (src: string, alt?: string) => boolean;
};

const EditorContext = createContext<EditorContextValue | null>(null);

type EditorProviderProps = {
  userId: string;
  postId?: string | null;
  /** 从草稿箱等入口指定要打开的草稿 ID */
  initialDraftId?: string | null;
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

export function EditorProvider({
  userId,
  postId = null,
  initialDraftId = null,
  children,
}: EditorProviderProps) {
  const isPostMode = Boolean(postId);
  const [editor, setEditor] = useState<TipTapEditor | null>(null);
  const [selectedText, setSelectedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [pendingAiRange, setPendingAiRange] = useState<AiPendingRange | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const selectionSnapshotRef = useRef<SelectionSnapshot | null>(null);

  // 草稿相关状态：title 是 UI 受控字段，content 不进 state，避免高频输入触发整树重渲染。
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [hydratedContent, setHydratedContent] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [noticeBanner, setNoticeBanner] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAutosaveReady, setIsAutosaveReady] = useState(false);
  const editorRef = useRef<TipTapEditor | null>(null);
  const shouldSyncAfterLoadRef = useRef(false);
  const isOnline = useNetworkStatus();

  const registerEditor = useCallback((nextEditor: TipTapEditor | null) => {
    editorRef.current = nextEditor;
    setEditor(nextEditor);
  }, []);

  // getContent 给自动保存 hook 用：直接从 editor 拉 HTML，无需把正文提升为 state。
  const getContent = useCallback(() => {
    return editorRef.current?.getHTML() ?? "";
  }, []);

  const showNoticeBanner = useCallback((message: string) => {
    setNoticeBanner(message);
  }, []);

  const dismissNoticeBanner = useCallback(() => {
    setNoticeBanner(null);
  }, []);

  const setImageUploading = useCallback((uploading: boolean) => {
    setIsUploadingImage(uploading);
  }, []);

  const handleDraftCreated = useCallback(
    (draft: { id: string; updatedAt: string }) => {
      setDraftId(draft.id);
    },
    []
  );

  const handleStatusChange = useCallback(
    (status: AutosaveStatus, savedAt: Date | null) => {
      setSaveStatus(status);
      if (savedAt) {
        setLastSavedAt(savedAt);
      }
    },
    []
  );

  const addTag = useCallback(
    (raw: string) => {
      const normalized = normalizePostTag(raw);
      if (!normalized.ok) {
        return normalized;
      }

      const canAdd = canAddPostTag(tags, normalized.tag);
      if (!canAdd.ok) {
        return canAdd;
      }

      setTags([...tags, normalized.tag]);
      return { ok: true as const };
    },
    [tags]
  );

  const removeTag = useCallback((tag: string) => {
    setTags((current) => current.filter((item) => item !== tag));
  }, []);

  const replaceTags = useCallback((next: string[]) => {
    setTags(next);
  }, []);

  const {
    seedSavedSnapshot: seedDraftSnapshot,
    saveDraft: saveDraftToCloud,
    syncPendingDraft,
    scheduleLocalPersist,
    isDirty: isDraftDirty,
  } = useDraftAutosave({
    userId,
    title,
    tags,
    getContent,
    draftId,
    isOnline,
    isReady: isAutosaveReady,
    enabled: !isPostMode,
    onCreated: handleDraftCreated,
    onStatus: handleStatusChange,
  });

  const { seedSavedSnapshot: seedPostSnapshot, saveDraft: savePostToCloud } =
    usePostAutosave({
      postId: postId ?? "",
      title,
      tags,
      getContent,
      isOnline,
      isReady: isAutosaveReady,
      enabled: isPostMode,
      onStatus: handleStatusChange,
    });

  const saveDraft = isPostMode ? savePostToCloud : saveDraftToCloud;

  const isDirty = useCallback(() => {
    if (isPostMode) {
      return false;
    }
    return isDraftDirty();
  }, [isDraftDirty, isPostMode]);

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

  // 进入编辑器：文章模式拉取 Post；草稿模式按 draftId 打开指定稿或新建空白稿。
  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setIsAutosaveReady(false);
      setTags([]);

      // 切换草稿/新建时先清空正文，避免加载完成前仍显示上一份内容。
      if (!postId && editorRef.current) {
        editorRef.current.commands.setContent("", { emitUpdate: false });
      }

      try {
        if (postId) {
          const response = await fetch(`/api/posts/${postId}`, {
            signal: controller.signal,
            credentials: "same-origin",
          });

          if (controller.signal.aborted) {
            return;
          }

          if (response.ok) {
            const data = (await response.json()) as {
              post: {
                title: string;
                content: string;
                tags: string[];
                updatedAt: string;
              };
            };

            const loadedTags = data.post.tags ?? [];
            setTitle(data.post.title);
            setTags(loadedTags);
            setHydratedContent(data.post.content);
            setNoticeBanner("已加载文章，修改后将自动保存");
            setSaveStatus("saved");
            setLastSavedAt(new Date(data.post.updatedAt));
            seedPostSnapshot(data.post.title, data.post.content, loadedTags);
          } else {
            setNoticeBanner("加载文章失败，请稍后重试");
            setSaveStatus("error");
          }

          return;
        }

        const online = typeof navigator !== "undefined" && navigator.onLine;

        // 草稿箱等入口通过 query 指定草稿时，优先拉取该条记录。
        const requestedDraft = initialDraftId
          ? await fetch(`/api/drafts/${initialDraftId}`, {
              signal: controller.signal,
              credentials: "same-origin",
            })
              .then(async (response) => {
                if (!response.ok) {
                  return null;
                }
                const data = (await response.json()) as {
                  draft: CloudDraftSnapshot | null;
                };
                return data.draft;
              })
              .catch((error) => {
                if (isAbortError(error) || controller.signal.aborted) {
                  return null;
                }
                return null;
              })
          : null;

        if (controller.signal.aborted) {
          return;
        }

        if (requestedDraft) {
          const localDraft = await getLocalDraft(userId);
          const pick = pickDraftOnLoadForId(
            userId,
            requestedDraft,
            localDraft,
            { isOnline: online }
          );

          if (pick.localRecordToPersist) {
            await putLocalDraft(pick.localRecordToPersist);
          }

          if (controller.signal.aborted) {
            return;
          }

          shouldSyncAfterLoadRef.current = pick.shouldSyncAfterLoad;

          const loaded = pick.draft ?? {
            id: requestedDraft.id,
            title: requestedDraft.title,
            content: requestedDraft.content,
            updatedAt: requestedDraft.updatedAt,
          };

          const loadedTags =
            pick.source === "local" ? (localDraft?.tags ?? []) : [];

          setTitle(loaded.title);
          setTags(loadedTags);
          setDraftId(loaded.id);
          setHydratedContent(loaded.content);
          setNoticeBanner(
            pick.source === "local"
              ? "已恢复本地草稿，可继续编辑"
              : "已加载草稿，可继续编辑"
          );
          setSaveStatus("saved");
          if (loaded.updatedAt) {
            setLastSavedAt(new Date(loaded.updatedAt));
          }
          seedDraftSnapshot(loaded.title, loaded.content);
          return;
        }

        if (initialDraftId) {
          setNoticeBanner("草稿不存在或已发布");
          setTitle("");
          setTags([]);
          setDraftId(null);
          setHydratedContent("");
          seedDraftSnapshot("", "");
          return;
        }

        // 无 draftId：新建空白稿，不恢复 latest / IDB pending。
        await clearLocalDraft(userId);
        setTitle("");
        setTags([]);
        setDraftId(null);
        setHydratedContent("");
        seedDraftSnapshot("", "");
        setSaveStatus("idle");
        setLastSavedAt(null);
        setNoticeBanner(null);
      } catch (error) {
        // Strict Mode 卸载或路由切换时会 abort 进行中的 hydrate，属正常流程。
        if (isAbortError(error) || controller.signal.aborted) {
          return;
        }

        if (postId) {
          setNoticeBanner("加载文章失败，请稍后重试");
          setSaveStatus("error");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsAutosaveReady(true);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [initialDraftId, postId, seedDraftSnapshot, seedPostSnapshot, userId]);

  // hydrate 完成后若本地较新且在线，立即尝试同步 pending（仅草稿模式）。
  useEffect(() => {
    if (isPostMode || !isAutosaveReady || !isOnline) {
      return;
    }

    if (shouldSyncAfterLoadRef.current) {
      shouldSyncAfterLoadRef.current = false;
      void syncPendingDraft();
    }
  }, [isAutosaveReady, isOnline, isPostMode, syncPendingDraft]);

  // 从离线恢复联网时自动上传本地 pending 草稿（仅草稿模式）。
  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    if (isPostMode || !isAutosaveReady) {
      prevOnlineRef.current = isOnline;
      return;
    }

    if (!prevOnlineRef.current && isOnline) {
      void syncPendingDraft();
    }

    prevOnlineRef.current = isOnline;
  }, [isAutosaveReady, isOnline, isPostMode, syncPendingDraft]);

  // 正文变更时 debounce 写入 IndexedDB（仅草稿模式）。
  useEffect(() => {
    if (isPostMode || !editor || !isAutosaveReady) {
      return;
    }

    const handleUpdate = () => {
      scheduleLocalPersist();
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, isAutosaveReady, isPostMode, scheduleLocalPersist]);

  // 标签变更时同步写入本地草稿（仅草稿模式）。
  useEffect(() => {
    if (isPostMode || !isAutosaveReady) {
      return;
    }

    scheduleLocalPersist();
  }, [isAutosaveReady, isPostMode, scheduleLocalPersist, tags]);

  // 把恢复出来的正文推入 TipTap：依赖只有 [editor, hydratedContent]，正常编辑流不会触发；
  // 编辑器实例切换（热更新等）时会重新对齐，避免 ref dedupe 引发的状态错位。
  useEffect(() => {
    if (!editor || hydratedContent === null) {
      return;
    }
    if (editor.getHTML() === hydratedContent) {
      return;
    }
    // emitUpdate:false 避免触发 onUpdate 重新标记 dirty 并产生回环保存。
    editor.commands.setContent(hydratedContent, { emitUpdate: false });
  }, [editor, hydratedContent]);

  // 用户开始编辑正文后自动收起顶部提示条，避免长时间遮挡视线。
  useEffect(() => {
    if (!editor || !noticeBanner) {
      return;
    }

    const dismiss = () => setNoticeBanner(null);
    editor.on("update", dismiss);
    return () => {
      editor.off("update", dismiss);
    };
  }, [editor, noticeBanner]);

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
      editorMode: isPostMode ? "post" : "draft",
      postId,
      selectedText,
      isGenerating,
      generationError,
      pendingAiRange,
      userId,
      title,
      setTitle,
      tags,
      setTags: replaceTags,
      addTag,
      removeTag,
      draftId,
      hydratedContent,
      saveStatus,
      lastSavedAt,
      isOnline,
      noticeBanner,
      showNoticeBanner,
      dismissNoticeBanner,
      saveDraft,
      isDirty,
      getEditorContent: getContent,
      isUploadingImage,
      setImageUploading,
      registerEditor,
      startGenerate,
      stopGenerate,
      acceptAiContent,
      rejectAiContent,
      insertImage,
    }),
    [
      acceptAiContent,
      dismissNoticeBanner,
      draftId,
      editor,
      generationError,
      getContent,
      isPostMode,
      postId,
      noticeBanner,
      showNoticeBanner,
      hydratedContent,
      insertImage,
      isDirty,
      isGenerating,
      isUploadingImage,
      setImageUploading,
      lastSavedAt,
      isOnline,
      pendingAiRange,
      registerEditor,
      rejectAiContent,
      saveDraft,
      saveStatus,
      selectedText,
      startGenerate,
      stopGenerate,
      tags,
      replaceTags,
      addTag,
      removeTag,
      title,
      userId,
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
