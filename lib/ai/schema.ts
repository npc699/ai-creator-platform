import { z } from "zod";

export const AI_GENERATE_MODES = [
  "generate",
  "selection",
  "polish",
  "expand",
  "shrink",
] as const;

export type AiGenerateMode = (typeof AI_GENERATE_MODES)[number];

export const aiGenerateModeSchema = z.enum(AI_GENERATE_MODES);

export const aiGenerateRequestSchema = z
  .object({
    mode: aiGenerateModeSchema,
    keyword: z.string().trim().max(1000).optional(),
    // 快捷操作与选区自定义指令传入选中片段；generate 模式由 keyword 承载完整写作指令。
    context: z.string().max(8000).optional(),
  })
  .superRefine((data, context) => {
    if (data.mode === "generate" || data.mode === "selection") {
      if (!data.keyword || data.keyword.length < 1) {
        context.addIssue({
          code: "custom",
          message:
            data.mode === "selection"
              ? "请输入对选中内容的处理要求"
              : "请输入写作指令",
          path: ["keyword"],
        });
      }
    }

    if (data.mode !== "generate" && (!data.context || data.context.trim().length < 1)) {
      context.addIssue({
        code: "custom",
        message: "请先选中要操作的内容",
        path: ["context"],
      });
    }
  });

export type AiGenerateRequest = z.infer<typeof aiGenerateRequestSchema>;
