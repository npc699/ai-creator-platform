"use client";

import { useEffect, useMemo, useState, type PointerEvent } from "react";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";

import { createEditorExtensions } from "@/components/editor/editor-extensions";
import { Toolbar } from "@/components/editor/Toolbar";
import { useEditorContext } from "@/components/editor/editor-context";
import { cn } from "@/lib/utils";

// Part 1 阶段先提供一段示例内容，便于验证富文本排版和工具栏状态。
const defaultContent = `
  <p>在内容创作领域，AI 写作工具已经成为不可忽视的生产力变量。本文将从生成质量、响应速度、可控性、价格区间四个维度，对市面上主流产品进行横向对比。</p>
  <blockquote>
    <p>评测数据来源于真实创作场景，样本量超过 500 篇，测试周期为 30 天。</p>
  </blockquote>
  <p>我们将重点关注以下几个核心问题：在相同 Prompt 下，不同工具生成内容的质量差异有多大？在专业垂类领域，哪款工具的表现更为稳定？</p>
`;

type TipTapEditorProps = {
  initialContent?: string;
};

function collapseEditorSelection(editor: Editor) {
  const { from, to } = editor.state.selection;
  if (from === to) {
    return;
  }

  // 收起选区即可同步清空右侧「已选中」面板，不必移动光标到文档其他位置。
  editor.chain().setTextSelection(to).run();
}

export function TipTapEditor({ initialContent = defaultContent }: TipTapEditorProps) {
  const [characterCount, setCharacterCount] = useState(0);
  const {
    acceptAiContent,
    isGenerating,
    pendingAiRange,
    registerEditor,
    rejectAiContent,
    selectedText,
  } = useEditorContext();

  const extensions = useMemo(() => createEditorExtensions(), []);

  const editor = useEditor(
    {
      content: initialContent,
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
      className="flex min-h-full w-full flex-1 flex-col"
      onPointerDown={handleWorkspacePointerDown}
    >
      <Toolbar editor={editor} />
      {isGenerating ? (
        <div
          aria-live="polite"
          className="border-b border-blue-100 bg-blue-50 px-5 py-2 text-center text-xs font-medium text-blue-600"
        >
          AI 正在生成内容，正文将实时写入编辑器...
        </div>
      ) : null}

      <article className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="mb-8 border-b border-zinc-200 pb-6">
          <input
            aria-label="文章标题"
            className="w-full bg-transparent text-3xl font-semibold tracking-tight text-zinc-950 outline-none placeholder:text-zinc-300"
            maxLength={100}
            onFocus={handleTitleFocus}
            placeholder="请输入标题（100字以内）"
            type="text"
          />
        </div>

        <EditorContent editor={editor} />

        {pendingAiRange ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-surface px-4 py-3">
            <p className="text-sm text-brand-on-surface">
              AI 已生成待确认内容，接收后保留，撤销将移除本次生成
            </p>
            <div className="flex items-center gap-2">
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
        ) : null}

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-200 pt-5 text-sm text-zinc-500">
          <span>已选中 {selectedText.length} 字</span>
          <span>已输入 {characterCount} 字</span>
        </div>
      </article>
    </div>
  );
}
