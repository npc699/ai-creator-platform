/** 本站上传资源的公开 URL 前缀，与 public/uploads 目录对应。 */
export function buildUploadPublicUrl(userId: string, filename: string) {
  return `/uploads/${userId}/${filename}`;
}

export function isLocalUploadUrl(url: string) {
  return url.startsWith("/uploads/");
}
