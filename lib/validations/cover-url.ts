import { z } from "zod";

import { isLocalUploadUrl } from "@/lib/assets/public-url";

/** 封面图 URL：可选，仅允许本站 /uploads 路径。 */
export const coverUrlSchema = z
  .string()
  .trim()
  .max(2048, "封面 URL 过长")
  .refine((value) => isLocalUploadUrl(value), {
    message: "封面须为本站上传的图片",
  })
  .optional()
  .nullable();
