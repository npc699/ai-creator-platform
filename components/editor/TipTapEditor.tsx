"use client";

import { useEffect, useMemo, useState, type PointerEvent } from "react";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";

import { EditorPostTagsDisplay } from "@/components/editor/editor-post-tags-display";
import { EditorCoverDisplay } from "@/components/editor/editor-cover-display";
import { createEditorExtensions } from "@/components/editor/editor-extensions";
import { Toolbar } from "@/components/editor/Toolbar";
import { useEditorContext } from "@/components/editor/editor-context";
import { createEditorImageHandlers } from "@/lib/editor/editor-image-handlers";
import { cn } from "@/lib/utils";

function collapseEditorSelection(editor: Editor) {
  const { from, to } = editor.state.selection;
  if (from === to) {
    return;
  }

  // 收起选区即可同步清空右侧「已选中」面板，不必移动光标到文档其他位置。
  editor.chain().setTextSelection(to).run();
}

export function TipTapEditor() {
  const [characterCount, setCharacterCount] = useState(0);
  const {
    acceptAiContent,
    isGenerating,
    pendingAiRange,
    registerEditor,
    rejectAiContent,
    selectedText,
    title,
    setTitle,
    showNoticeBanner,
    setImageUploading,
    isUploadingImage,
  } = useEditorContext();

  const extensions = useMemo(() => createEditorExtensions(), []);

  const editor = useEditor(
    {
      // 初始正文留空，真实内容由 EditorProvider 在 hydrate /api/drafts/latest 之后注入。
      content: "",
      editorProps: {
        attributes: {
          "aria-label": "文章正文",
          class: "tiptap-editor min-h-[560px] outline-none",
        },
      },
      extensions,
      // Next.js 客户端水合前不立即渲染，避免 TipTap 内容产生 hydration 差异。
      immediatelyRender: false,
      onCreate: ({ editor }) => {
        setCharacterCount(editor.storage.characterCount.characters());
      },
      onUpdate: ({ editor }) => {
        setCharacterCount(editor.storage.characterCount.characters());
      },
    },
    [extensions]
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    const handlers = createEditorImageHandlers({
      getEditor: () => editor,
      onUploadingChange: setImageUploading,
      onUploadError: (message) => showNoticeBanner(message),
    });

    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        ...handlers,
      },
    });
  }, [editor, setImageUploading, showNoticeBanner]);

  useEffect(() => {
    registerEditor(editor);

    return () => {
      registerEditor(null);
    };
  }, [editor, registerEditor]);

  useEffect(() => {
    if (!editor) return;

    // CharacterCount 在部分命令（如撤销）后需靠 transaction 同步字数。
    const syncCharacterCount = () => {
      setCharacterCount(editor.storage.characterCount.characters());
    };

    editor.on("transaction", syncCharacterCount);

    return () => {
      editor.off("transaction", syncCharacterCount);
    };
  }, [editor]);

  // 生成结束后把视口滚到待确认内容附近，同时底部操作条始终可见（见下方固定栏）。
  useEffect(() => {
    if (!editor || !pendingAiRange) {
      return;
    }

    const { to } = pendingAiRange;
    requestAnimationFrame(() => {
      editor.chain().focus().setTextSelection(to).scrollIntoView().run();
    });
  }, [editor, pendingAiRange]);

  const handleWorkspacePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!editor || isGenerating) {
      return;
    }

    const target = event.target as HTMLElement;
    // 正文与工具栏保留原有交互，其余左侧空白区域点击后收起选区。
    if (target.closest(".ProseMirror") || target.closest("[data-editor-toolbar]")) {
      return;
    }

    collapseEditorSelection(editor);
  };

  const handleTitleFocus = () => {
    if (!editor) {
      return;
    }

    collapseEditorSelection(editor);
  };

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden"
      onPointerDown={handleWorkspacePointerDown}
    >
      <Toolbar editor={editor} />
      {isGenerating ? (
        <div
          aria-live="polite"
          className="shrink-0 border-b border-blue-100 bg-blue-50 px-5 py-2 text-center text-xs font-medium text-blue-600"
        >
          AI 正在生成内容，正文将实时写入编辑器...
        </div>
      ) : null}
      {isUploadingImage ? (
        <div
          aria-live="polite"
          className="shrink-0 border-b border-amber-100 bg-amber-50 px-5 py-2 text-center text-xs font-medium text-amber-700"
        >
          图片上传中，请稍候…
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
      <article className="mx-auto w-full max-w-3xl px-6 pb-8 pt-10">
        <div className="mb-8 border-b border-zinc-200/80 pb-6">
          <input
            aria-label="文章标题"
            className="w-full bg-transparent text-3xl font-semibold tracking-tight text-zinc-950 outline-none placeholder:text-zinc-300"
            maxLength={100}
            onChange={(event) => setTitle(event.target.value)}
            onFocus={handleTitleFocus}
            placeholder="请输入标题（100字以内）"
            type="text"
            value={title}
          />
          <EditorCoverDisplay />
          <EditorPostTagsDisplay />
        </div>

        <EditorContent editor={editor} />
      </article>
      </div>

      {pendingAiRange ? (
        <div
          aria-live="polite"
          className="shrink-0 border-t border-brand-border bg-brand-surface/95 px-6 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-brand-on-surface">
              AI 已生成待确认内容，接收后保留，撤销将移除本次生成
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                onClick={rejectAiContent}
                type="button"
              >
                撤销
              </button>
              <button
                className={cn(
                  "inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-white transition",
                  "bg-brand-primary hover:bg-blue-500"
                )}
                onClick={acceptAiContent}
                type="button"
              >
                接收
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="shrink-0 border-t border-zinc-200/80 bg-[#fdfcf8] px-6 pb-6 pt-3">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
          <span>已选中 {selectedText.length} 字</span>
          <span>已输入 {characterCount} 字</span>
        </div>
      </div>
    </div>
  );
}
