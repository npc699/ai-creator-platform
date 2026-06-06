export type EditorAsset = {
  id: string;
  name: string;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
  source: "UPLOAD" | "AI";
  createdAt: string;
  updatedAt: string;
};

async function parseJsonError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchEditorAssets(): Promise<EditorAsset[]> {
  const response = await fetch("/api/assets", { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error(await parseJsonError(response, "加载素材失败"));
  }

  const data = (await response.json()) as { assets: EditorAsset[] };
  return data.assets ?? [];
}

export async function uploadLocalImageAsset(file: File): Promise<EditorAsset> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/assets", {
    method: "POST",
    body: formData,
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response, "图片上传失败"));
  }

  const data = (await response.json()) as { asset: EditorAsset };
  if (!data.asset?.url) {
    throw new Error("上传响应无效");
  }

  return data.asset;
}

export async function registerAiImageAsset(name: string, url: string): Promise<EditorAsset> {
  const response = await fetch("/api/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, url, source: "AI" }),
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response, "保存素材失败"));
  }

  const data = (await response.json()) as { asset: EditorAsset };
  if (!data.asset?.url) {
    throw new Error("保存响应无效");
  }

  return data.asset;
}

export async function renameEditorAsset(id: string, name: string): Promise<EditorAsset> {
  const response = await fetch(`/api/assets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response, "重命名失败"));
  }

  const data = (await response.json()) as { asset: EditorAsset };
  return data.asset;
}

export async function deleteEditorAsset(id: string) {
  const response = await fetch(`/api/assets/${id}`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response, "删除素材失败"));
  }
}
