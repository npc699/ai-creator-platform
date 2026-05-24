/** AI 生图与常见图片扩展名，用于 mimeType 缺失时的兜底识别。 */
const IMAGE_NAME_PATTERN = /\.(jpe?g|png|webp|gif)$/i;

export function inferImageMimeType(options: {
  mimeType: string | null;
  name: string;
  source?: "UPLOAD" | "AI";
}) {
  if (options.mimeType?.startsWith("image/")) {
    return options.mimeType;
  }

  if (options.source === "AI") {
    return "image/jpeg";
  }

  if (IMAGE_NAME_PATTERN.test(options.name)) {
    return "image/jpeg";
  }

  return options.mimeType;
}

export function isImageAsset(options: {
  mimeType: string | null;
  name: string;
  source?: "UPLOAD" | "AI";
}) {
  const mimeType = inferImageMimeType(options);
  return mimeType?.startsWith("image/") ?? false;
}
