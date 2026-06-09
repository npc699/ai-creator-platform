import "server-only";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildUploadPublicUrl, isLocalUploadUrl } from "./public-url";

type SaveUploadInput = {
  userId: string;
  buffer: Buffer;
  mimeType: string;
};

export function resolveUploadAbsolutePath(publicUrl: string) {
  if (!isLocalUploadUrl(publicUrl)) {
    return null;
  }

  const relative = publicUrl.replace(/^\/uploads\//, "");
  const segments = relative.split("/").filter(Boolean);
  if (segments.length < 2) {
    return null;
  }

  const resolved = path.join(process.cwd(), "public", "uploads", ...segments);
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  if (!resolved.startsWith(uploadsRoot)) {
    return null;
  }

  return resolved;
}

export async function saveUploadedImageToDisk(
  input: SaveUploadInput,
  filename: string
) {
  const userDir = path.join(process.cwd(), "public", "uploads", input.userId);
  await mkdir(userDir, { recursive: true });

  const absolutePath = path.join(userDir, filename);
  await writeFile(absolutePath, input.buffer);

  return {
    url: buildUploadPublicUrl(input.userId, filename),
    mimeType: input.mimeType,
    sizeBytes: input.buffer.byteLength,
  };
}

export async function deleteDiskUploadFile(publicUrl: string) {
  const absolutePath = resolveUploadAbsolutePath(publicUrl);
  if (!absolutePath) {
    return;
  }

  try {
    await unlink(absolutePath);
  } catch {
    // 文件可能已被手动删除，删除素材记录时静默忽略即可。
  }
}
