import "server-only";

import { randomUUID } from "node:crypto";

import {
  buildUploadPublicUrl,
  isBlobUploadUrl,
  isLocalUploadUrl,
} from "./public-url";
import {
  deleteBlobUploadFile,
  saveUploadedImageToBlob,
} from "./storage-blob";
import {
  deleteDiskUploadFile,
  saveUploadedImageToDisk,
} from "./storage-local";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

function normalizeExtension(mimeType: string, filename: string) {
  const fromMime = MIME_TO_EXT[mimeType];
  if (fromMime) {
    return fromMime === "jpeg" ? "jpg" : fromMime;
  }

  const dot = filename.lastIndexOf(".");
  if (dot === -1) {
    return null;
  }

  const ext = filename.slice(dot + 1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return null;
  }

  return ext === "jpeg" ? "jpg" : ext;
}

function isBlobStorageEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

export { buildUploadPublicUrl, isLocalUploadUrl };

export { resolveUploadAbsolutePath } from "./storage-local";

type SaveUploadInput = {
  userId: string;
  buffer: Buffer;
  mimeType: string;
  originalName: string;
};

export async function saveUploadedImage(input: SaveUploadInput) {
  const extension = normalizeExtension(input.mimeType, input.originalName);
  if (!extension) {
    throw new Error("不支持的图片格式");
  }

  const filename = `${randomUUID()}.${extension}`;
  const payload = {
    userId: input.userId,
    buffer: input.buffer,
    mimeType: input.mimeType,
  };

  return isBlobStorageEnabled()
    ? saveUploadedImageToBlob(payload, filename)
    : saveUploadedImageToDisk(payload, filename);
}

/** AI 生图返回的临时外链会过期，入库前先下载到平台存储。 */
export async function saveRemoteImage(input: {
  userId: string;
  remoteUrl: string;
  originalName: string;
}) {
  let response: Response;
  try {
    response = await fetch(input.remoteUrl, {
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new Error("无法下载 AI 图片，请重新生成后再保存");
  }

  if (!response.ok) {
    throw new Error("AI 图片链接已失效，请重新生成后再保存");
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const mimeType = contentType.split(";")[0]?.trim() || "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    throw new Error("远程资源不是有效图片");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return saveUploadedImage({
    userId: input.userId,
    buffer,
    mimeType,
    originalName: input.originalName,
  });
}

export async function deleteUploadFile(publicUrl: string) {
  if (isLocalUploadUrl(publicUrl)) {
    await deleteDiskUploadFile(publicUrl);
    return;
  }

  if (isBlobUploadUrl(publicUrl)) {
    await deleteBlobUploadFile(publicUrl);
  }
}
