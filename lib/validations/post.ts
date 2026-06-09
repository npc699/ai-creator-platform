import { z } from "zod";

import { coverUrlSchema } from "./cover-url";

const POST_CONTENT_MAX_BYTES = 1_000_000;

function stripHtmlText(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

const postTitleSchema = z
  .string()
  .trim()
  .min(1, "标题不能为空")
  .max(100, "标题不能超过 100 字");

const postContentSchema = z
  .string()
  .min(1, "正文不能为空")
  .max(POST_CONTENT_MAX_BYTES, "正文超出大小限制")
  .refine((value) => stripHtmlText(value).length > 0, {
    message: "正文不能为空",
  });

const draftIdSchema = z.string().trim().min(1).optional().nullable();

const postTagsSchema = z
  .array(z.string().trim().min(1, "标签不能为空").max(20, "单个标签不能超过 20 字"))
  .max(8, "标签不能超过 8 个")
  .optional();

export const postPublishSchema = z.object({
  title: postTitleSchema,
  content: postContentSchema,
  draftId: draftIdSchema,
  promptId: draftIdSchema,
  tags: postTagsSchema,
  coverUrl: coverUrlSchema,
});

export const postUpdateSchema = z.object({
  promptId: draftIdSchema,
});

/** 详情页上线 / 下线切换 */
export const postStatusPatchSchema = z.object({
  status: z.enum(["PUBLISHED", "ARCHIVED"]),
});

export type PostPublishInput = z.infer<typeof postPublishSchema>;
export type PostUpdateInput = z.infer<typeof postUpdateSchema>;
export type PostStatusPatchInput = z.infer<typeof postStatusPatchSchema>;
