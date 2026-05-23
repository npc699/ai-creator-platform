import { LOCAL_IMAGE_MAX_BYTES } from "@/lib/editor/local-image";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** 服务端校验上传图片：与前端 local-image 规则保持一致。 */
export function validateImageUploadFile(file: File) {
  if (file.size === 0) {
    return "文件为空，请选择有效图片";
  }

  if (file.size > LOCAL_IMAGE_MAX_BYTES) {
    return "图片大小不能超过 5MB";
  }

  const mimeAllowed = file.type ? ALLOWED_MIME_TYPES.has(file.type) : false;
  const lower = file.name.toLowerCase();
  const extensionAllowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"].some((ext) =>
    lower.endsWith(ext)
  );

  if (!mimeAllowed && !extensionAllowed) {
    return "仅支持 JPG、PNG、WebP、GIF 格式";
  }

  return null;
}
