import { z } from "zod";

export const ASSET_SOURCES = ["UPLOAD", "AI"] as const;

export const assetSourceSchema = z.enum(ASSET_SOURCES);

export const assetRegisterSchema = z.object({
  name: z.string().trim().min(1, "请输入素材名称").max(200, "名称过长"),
  url: z.string().trim().url("图片地址无效"),
  source: z.literal("AI"),
});

export const assetRenameSchema = z.object({
  name: z.string().trim().min(1, "请输入素材名称").max(200, "名称过长"),
});

export type AssetRegisterInput = z.infer<typeof assetRegisterSchema>;
export type AssetRenameInput = z.infer<typeof assetRenameSchema>;
