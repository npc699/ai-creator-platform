"use client";

import { useEffect, useState } from "react";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { Toolbar } from "@/components/editor/Toolbar";

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

export function TipTapEditor({ initialContent = defaultContent }: TipTapEditorProps) {
  const [characterCount, setCharacterCount] = useState(0);

  const editor = useEditor({
    content: initialContent,
    editorProps: {
      attributes: {
        "aria-label": "文章正文",
        class: "tiptap-editor min-h-[560px] outline-none",
      },
    },
    extensions: [
      // StarterKit 已内置标题、引用、列表、下划线、链接、代码块、分割线等能力。
      StarterKit.configure({
        link: {
          // 编辑态点击链接不跳转，避免测试时离开编辑器。
          openOnClick: false,
        },
      }),
      Image.configure({
        allowBase64: true,
        inline: false,
      }),
      // TableKit 一次性注册 Table / TableRow / TableHeader / TableCell，统一表格编辑能力。
      TableKit.configure({
        table: {
          resizable: true,
          // 默认 cellMinWidth 仅 25px，3 列表格总宽约 75px，在宽编辑区里几乎看不见。
          cellMinWidth: 120,
        },
      }),
      Placeholder.configure({
        placeholder: "继续输入，或点击右侧“AI 生成”让 AI 来写...",
      }),
      CharacterCount.configure({
        mode: "textSize",
      }),
    ],
    // Next.js 客户端水合前不立即渲染，避免 TipTap 内容产生 hydration 差异。
    immediatelyRender: false,
    onCreate: ({ editor }) => {
      setCharacterCount(editor.storage.characterCount.characters());
    },
    onUpdate: ({ editor }) => {
      setCharacterCount(editor.storage.characterCount.characters());
    },
  });

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

  return (
    <div className="flex min-h-full flex-col">
      <Toolbar editor={editor} />

      <article className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="mb-8 border-b border-zinc-200 pb-6">
          <input
            aria-label="文章标题"
            className="w-full bg-transparent text-3xl font-semibold tracking-tight text-zinc-950 outline-none placeholder:text-zinc-300"
            maxLength={100}
            placeholder="请输入标题（100字以内）"
            type="text"
          />
        </div>

        <EditorContent editor={editor} />

        <div className="mt-8 border-t border-zinc-200 pt-5 text-sm text-zinc-500">
          已输入 {characterCount} 字
        </div>
      </article>
    </div>
  );
}
