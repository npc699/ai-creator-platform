/** 本地上传插入编辑器：格式与大小限制（TipTap 已开启 allowBase64）。 */
export const LOCAL_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const LOCAL_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const;

function hasAllowedExtension(filename: string) {
  const lower = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function validateLocalImageFile(file: File): string | null {
  if (file.size === 0) {
    return "文件为空，请选择有效图片";
  }

  if (file.size > LOCAL_IMAGE_MAX_BYTES) {
    return "图片大小不能超过 5MB";
  }

  const mimeAllowed = file.type ? ALLOWED_MIME_TYPES.has(file.type) : false;
  const extensionAllowed = hasAllowedExtension(file.name);

  if (!mimeAllowed && !extensionAllowed) {
    return "仅支持 JPG、PNG、WebP、GIF 格式";
  }

  return null;
}

export function readLocalImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.startsWith("data:image/")) {
        resolve(reader.result);
        return;
      }

      reject(new Error("读取图片失败，请换一张图片重试"));
    };

    reader.onerror = () => {
      reject(new Error("读取图片失败，请换一张图片重试"));
    };

    reader.readAsDataURL(file);
  });
}

export function formatLocalImageSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
