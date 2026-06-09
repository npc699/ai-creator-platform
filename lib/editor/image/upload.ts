import { validateLocalImageFile } from "./local-image";

export type EditorImageUploadResult = {
  url: string;
  mimeType?: string;
  sizeBytes?: number;
};

async function parseUploadError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}

/** 直插正文：仅上传拿 URL，不写入「我的素材」库。 */
export async function uploadEditorImage(
  file: File
): Promise<EditorImageUploadResult> {
  const validationError = validateLocalImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await parseUploadError(response, "图片上传失败"));
  }

  const data = (await response.json()) as EditorImageUploadResult;
  if (!data.url) {
    throw new Error("上传响应无效");
  }

  return data;
}

/** 将 AI 等临时外链持久化到本站 uploads，不写入素材库（供封面等场景）。 */
export async function persistRemoteEditorImage(
  remoteUrl: string
): Promise<EditorImageUploadResult> {
  const response = await fetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: remoteUrl }),
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await parseUploadError(response, "图片保存失败"));
  }

  const data = (await response.json()) as EditorImageUploadResult;
  if (!data.url) {
    throw new Error("保存响应无效");
  }

  return data;
}
