import { z } from "zod";

// 标题入库默认值：用户允许留空，但 Prisma 字段是 NOT NULL，所以服务端兜底。
export const DRAFT_DEFAULT_TITLE = "未命名草稿";

// 正文上限保守取 1MB，足够覆盖图文混排，同时拦截恶意 payload。
const DRAFT_CONTENT_MAX_BYTES = 1_000_000;

const titleSchema = z
  .string()
  .trim()
  .max(100, "标题不能超过 100 字")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : DRAFT_DEFAULT_TITLE));

const contentSchema = z
  .string()
  .min(1, "草稿内容不能为空")
  .max(DRAFT_CONTENT_MAX_BYTES, "草稿内容超出大小限制");

const promptIdSchema = z
  .string()
  .trim()
  .min(1)
  .optional()
  .nullable();

const draftTagsSchema = z
  .array(z.string().trim().min(1, "标签不能为空").max(20, "单个标签不能超过 20 字"))
  .max(8, "标签不能超过 8 个")
  .optional();

export const draftCreateSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  promptId: promptIdSchema,
  tags: draftTagsSchema,
});

export const draftUpdateSchema = z.object({
  title: titleSchema,
  content: contentSchema,
  promptId: promptIdSchema,
  tags: draftTagsSchema,
});

export type DraftCreateInput = z.infer<typeof draftCreateSchema>;
export type DraftUpdateInput = z.infer<typeof draftUpdateSchema>;
