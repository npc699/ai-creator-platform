/** 从 TipTap HTML 提取纯文本摘要，供列表页展示。 */
export function buildPostExcerpt(html: string, maxLength = 120) {
  const text = html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
}
