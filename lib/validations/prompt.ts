import { z } from "zod";

import {
  DEFAULT_PROMPT_CATEGORY_SLUG,
  PROMPT_CATEGORY_SLUGS,
} from "@/lib/prompts/category";

const PROMPT_CONTENT_MAX_BYTES = 1_000_000;

export const promptCategorySchema = z.enum(PROMPT_CATEGORY_SLUGS);

export const promptCreateSchema = z.object({
  title: z.string().trim().min(1, "请输入标题").max(100, "标题不能超过 100 字"),
  content: z
    .string()
    .min(1, "Prompt 内容不能为空")
    .max(PROMPT_CONTENT_MAX_BYTES, "内容超出大小限制"),
  category: promptCategorySchema.default(DEFAULT_PROMPT_CATEGORY_SLUG),
});

export const promptUpdateSchema = z.object({
  title: z.string().trim().min(1, "请输入标题").max(100, "标题不能超过 100 字").optional(),
  content: z
    .string()
    .min(1, "Prompt 内容不能为空")
    .max(PROMPT_CONTENT_MAX_BYTES, "内容超出大小限制")
    .optional(),
  category: promptCategorySchema.optional(),
  isFavorite: z.boolean().optional(),
});

export type PromptCreateInput = z.infer<typeof promptCreateSchema>;
export type PromptUpdateInput = z.infer<typeof promptUpdateSchema>;
