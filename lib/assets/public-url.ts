/** 本站上传资源的公开 URL 前缀，与 public/uploads 目录对应。 */
export function buildUploadPublicUrl(userId: string, filename: string) {
  return `/uploads/${userId}/${filename}`;
}

export function isLocalUploadUrl(url: string) {
  return url.startsWith("/uploads/");
}

export function isBlobUploadUrl(url: string) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

/** 本地磁盘或 Vercel Blob 等平台托管的上传 URL。 */
export function isPlatformUploadUrl(url: string) {
  return isLocalUploadUrl(url) || isBlobUploadUrl(url);
}
