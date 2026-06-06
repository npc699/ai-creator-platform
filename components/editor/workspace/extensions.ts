import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import type { Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";

import { AiGeneratedMark } from "./ai-generated-mark";

/** 编辑器扩展列表集中维护，避免 useEditor 与 context 使用不同 schema。 */
export function createEditorExtensions(): Extensions {
  return [
    StarterKit.configure({
      link: {
        openOnClick: false,
      },
    }),
    Image.configure({
      allowBase64: false,
      inline: false,
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
