import { z } from "zod";

import { isPlatformUploadUrl } from "@/lib/assets/public-url";

/** 封面图 URL：可选，仅允许平台托管的上传路径。 */
export const coverUrlSchema = z
  .string()
  .trim()
  .max(2048, "封面 URL 过长")
  .refine((value) => isPlatformUploadUrl(value), {
    message: "封面须为平台上传的图片",
  })
  .optional()
  .nullable();
