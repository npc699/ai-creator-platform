import { z } from "zod";

/** Seedream 5.0 方式 1：分辨率档位（宽高比由 prompt 描述，勿与 WxH 像素格式混用）。 */
export const AI_IMAGE_SIZES = ["2K", "3K", "4K"] as const;

export type AiImageSize = (typeof AI_IMAGE_SIZES)[number];

export const aiImageSizeSchema = z.enum(AI_IMAGE_SIZES);

export const aiImageRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "请输入图片描述")
    .max(500, "图片描述不能超过 500 字"),
  size: aiImageSizeSchema.default("2K"),
});

export type AiImageRequest = z.infer<typeof aiImageRequestSchema>;

export const aiImageResponseSchema = z.object({
  url: z.string().url(),
  revisedPrompt: z.string().optional(),
});

export type AiImageResponse = z.infer<typeof aiImageResponseSchema>;
