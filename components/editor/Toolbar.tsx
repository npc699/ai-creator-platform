"use client";

import { useEffect, useState } from "react";
import type { Editor as TiptapEditor } from "@tiptap/react";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  SeparatorHorizontal,
  SquareCode,
  Table as TableIcon,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";

import { InsertImageDialog } from "@/components/editor/InsertImageDialog";
import { cn } from "@/lib/utils";

type ToolbarItem = {
  label: string;
  icon: LucideIcon;
  action?: (editor: TiptapEditor) => void;
  canRun?: (editor: TiptapEditor) => boolean;
  disabled?: boolean;
  isActive?: (editor: TiptapEditor) => boolean;
};

type ToolbarProps = {
  editor: TiptapEditor | null;
};

/** 测试阶段用浏览器 prompt 收集 URL，后续可替换为素材库/上传弹窗。 */
function promptUrl(message: string, defaultValue = "") {
  const value = window.prompt(message, defaultValue);
  if (value === null) {
    return null;
  }
  return value.trim();
}

// 工具栏用配置驱动，后续新增 TipTap 扩展时只需要补充 action / isActive。
const toolbarGroups: ToolbarItem[][] = [
  [
    {
      label: "粗体",
      icon: Bold,
      action: (editor) => editor.chain().focus().toggleBold().run(),
      isActive: (editor) => editor.isActive("bold"),
    },
    {
      label: "斜体",
      icon: Italic,
      action: (editor) => editor.chain().focus().toggleItalic().run(),
      isActive: (editor) => editor.isActive("italic"),
    },
    {
      label: "下划线",
      icon: Underline,
      action: (editor) => editor.chain().focus().toggleUnderline().run(),
      isActive: (editor) => editor.isActive("underline"),
    },
  ],
  [
    {
      label: "一级标题",
      icon: Heading1,
      action: (editor) =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: (editor) => editor.isActive("heading", { level: 1 }),
    },
    {
      label: "二级标题",
      icon: Heading2,
      action: (editor) =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: (editor) => editor.isActive("heading", { level: 2 }),
    },
    {
      label: "三级标题",
      icon: Heading3,
      action: (editor) =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: (editor) => editor.isActive("heading", { level: 3 }),
    },
  ],
  [
    {
      label: "有序列表",
      icon: ListOrdered,
      action: (editor) => editor.chain().focus().toggleOrderedList().run(),
      isActive: (editor) => editor.isActive("orderedList"),
    },
    {
      label: "无序列表",
      icon: List,
      action: (editor) => editor.chain().focus().toggleBulletList().run(),
      isActive: (editor) => editor.isActive("bulletList"),
    },
    {
      label: "引用",
      icon: Quote,
      action: (editor) => editor.chain().focus().toggleBlockquote().run(),
      isActive: (editor) => editor.isActive("blockquote"),
    },
  ],
  [
    {
      label: "行内代码",
      icon: Code,
      action: (editor) => editor.chain().focus().toggleCode().run(),
      isActive: (editor) => editor.isActive("code"),
    },
    {
      label: "代码块",
      icon: SquareCode,
      action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
      isActive: (editor) => editor.isActive("codeBlock"),
    },
  ],
  [
    {
      label: "插入链接",
      icon: LinkIcon,
      action: (editor) => {
        const previousUrl = editor.getAttributes("link").href as string | undefined;
        const url = promptUrl("请输入链接地址（留空则移除链接）", previousUrl ?? "https://");
        if (url === null) return;
        if (!url) {
          editor.chain().focus().extendMarkRange("link").unsetLink().run();
          return;
        }
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      },
      isActive: (editor) => editor.isActive("link"),
    },
    {
      label: "插入表格",
      icon: TableIcon,
      // 默认插入 3 行 3 列并带表头，符合大多数创作场景的初始表格。
      action: (editor) =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      label: "分割线",
      icon: SeparatorHorizontal,
      action: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
  ],
  [
    {
      label: "撤销",
      icon: Undo2,
      action: (editor) => editor.chain().focus().undo().run(),
      canRun: (editor) => editor.can().chain().focus().undo().run(),
    },
    {
      label: "重做",
      icon: Redo2,
      action: (editor) => editor.chain().focus().redo().run(),
      canRun: (editor) => editor.can().chain().focus().redo().run(),
    },
  ],
];

export function Toolbar({ editor }: ToolbarProps) {
  const [, setEditorStateVersion] = useState(0);
  const [isInsertImageOpen, setIsInsertImageOpen] = useState(false);

  useEffect(() => {
    if (!editor) return;

    // TipTap 的 editor 实例是可变对象，需要订阅事务更新来刷新按钮激活态。
    const refreshToolbarState = () => {
      setEditorStateVersion((version) => version + 1);
    };

    editor.on("transaction", refreshToolbarState);
    editor.on("selectionUpdate", refreshToolbarState);

    return () => {
      editor.off("transaction", refreshToolbarState);
      editor.off("selectionUpdate", refreshToolbarState);
    };
  }, [editor]);

  return (
    <>
      <div
        className="shrink-0 border-b border-zinc-200/80 bg-white/90 px-5 py-3"
        data-editor-toolbar
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
        {toolbarGroups.map((group, groupIndex) => (
          <div className="flex items-center gap-1" key={groupIndex}>
            {groupIndex > 0 ? (
              <div className="mx-2 h-5 w-px bg-zinc-200" />
            ) : null}

            {groupIndex === 4 ? (
              <button
                aria-label="插入图片"
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 transition",
                  !editor ? "cursor-not-allowed opacity-40" : "hover:bg-zinc-200"
                )}
                disabled={!editor}
                onPointerDown={(event) => {
                  event.preventDefault();
                  if (!editor) return;
                  setIsInsertImageOpen(true);
                }}
                title="插入图片"
                type="button"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
            ) : null}

            {group.map((item) => {
              const Icon = item.icon;
              // editor 初始化完成前禁用按钮，避免命令链访问空实例。
              const isDisabled =
                !editor || item.disabled || item.canRun?.(editor) === false;
              const isActive = editor ? item.isActive?.(editor) === true : false;

              return (
                <button
                  aria-label={item.label}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 transition",
                    isDisabled
                      ? "cursor-not-allowed opacity-40"
                      : "hover:bg-zinc-200",
                    isActive ? "bg-zinc-200" : null
                  )}
                  disabled={isDisabled}
                  key={item.label}
                  onPointerDown={(event) => {
                    // 避免按钮抢走编辑器选区，否则标题、列表、引用等块级命令会作用不到当前段落。
                    event.preventDefault();
                    if (!editor || isDisabled) return;
                    item.action?.(editor);
                  }}
                  title={item.label}
                  type="button"
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        ))}
      </div>
      </div>

      {isInsertImageOpen ? (
        <InsertImageDialog onClose={() => setIsInsertImageOpen(false)} />
      ) : null}
    </>
  );
}
