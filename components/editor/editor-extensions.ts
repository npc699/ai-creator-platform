import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

import { AiGeneratedMark } from "@/components/editor/extensions/ai-generated-mark";

/** 编辑器扩展列表集中维护，避免 useEditor 与 context 使用不同 schema。 */
export function createEditorExtensions(): Extensions {
  return [
    StarterKit.configure({
      link: {
        // 编辑态点击链接不跳转，避免测试时离开编辑器。
        openOnClick: false,
      },
    }),
    Image.configure({
      // 图片统一走 /api/assets 上传后的 URL，禁止 Base64 写入草稿 HTML。
      allowBase64: false,
      inline: false,
      // 角点拖拽可自由改宽高；按住 Shift 可临时锁定宽高比
      resize: {
        enabled: true,
        directions: ["bottom-left", "bottom-right", "top-left", "top-right"],
        minWidth: 80,
        minHeight: 80,
        alwaysPreserveAspectRatio: false,
      },
    }),
    TableKit.configure({
      table: {
        resizable: true,
        cellMinWidth: 120,
      },
    }),
    Placeholder.configure({
      placeholder: "继续输入，或点击右侧“AI 生成”让 AI 来写...",
    }),
    CharacterCount.configure({
      mode: "textSize",
    }),
    AiGeneratedMark,
  ];
}
