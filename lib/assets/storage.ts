import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildUploadPublicUrl as buildPublicUrl,
  isLocalUploadUrl,
} from "./public-url";

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

/** 本站上传资源的公开 URL 前缀，与 public/uploads 目录对应。 */
export function buildUploadPublicUrl(userId: string, filename: string) {
  return buildPublicUrl(userId, filename);
}

export { isLocalUploadUrl };

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

/** AI 生图返回的临时外链会过期，入库前先下载到本站 uploads 目录。 */
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

export async function deleteLocalUploadFile(publicUrl: string) {
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
