import "server-only";

import { del, put } from "@vercel/blob";

type SaveUploadInput = {
  userId: string;
  buffer: Buffer;
  mimeType: string;
};

export async function saveUploadedImageToBlob(
  input: SaveUploadInput,
  filename: string
) {
  const pathname = `${input.userId}/${filename}`;
  const blob = await put(pathname, input.buffer, {
    access: "public",
    contentType: input.mimeType,
  });

  return {
    url: blob.url,
    mimeType: input.mimeType,
    sizeBytes: input.buffer.byteLength,
  };
}

export async function deleteBlobUploadFile(publicUrl: string) {
  try {
    await del(publicUrl);
  } catch {
    // Blob 可能已被手动删除，删除素材记录时静默忽略即可。
  }
}
