import { validateLocalImageFile } from "@/lib/editor/local-image";

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
export async function uploadEditorImage(file: File): Promise<EditorImageUploadResult> {
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
