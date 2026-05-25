/** 将浏览量、点赞数格式化为 Feed 卡片展示文案（如 1200 → 1.2k）。 */
export function formatFeedMetric(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(value);
}
