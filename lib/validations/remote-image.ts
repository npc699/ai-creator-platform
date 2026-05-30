import { z } from "zod";

/** 将 AI 等临时外链下载到本站 uploads，不写入素材库。 */
export const remoteImagePersistSchema = z.object({
  url: z.string().trim().url("图片地址无效"),
});

export type RemoteImagePersistInput = z.infer<typeof remoteImagePersistSchema>;
