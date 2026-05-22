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
      allowBase64: true,
      inline: false,
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
