import { Mark } from "@tiptap/core";

/** 标记 AI 流式写入的待确认内容，接收后移除该 mark。 */
export const AiGeneratedMark = Mark.create({
  name: "aiGenerated",

  parseHTML() {
    return [{ tag: "span[data-ai-generated]" }];
  },

  renderHTML() {
    return ["span", { "data-ai-generated": "", class: "ai-generated-text" }, 0];
  },
});
