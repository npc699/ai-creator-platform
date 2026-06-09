const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

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

/** 打分功能接入前的占位分值，仅草稿等无需质量分的场景使用。 */
export const DEFAULT_FEED_SCORE = 85;

export function formatFeedScoreLabel(score: number | null) {
  if (score === null) {
    return "待评分";
  }
  return `质量 ${score} 分`;
}

/** 列表页相对时间，强调时效感（如「2小时前」）。 */
export function formatRelativeTime(
  date: Date,
  now: Date = new Date()
): string {
  const diffMs = Math.max(0, now.getTime() - date.getTime());

  if (diffMs < MS_PER_MINUTE) {
    return "刚刚";
  }

  const minutes = Math.floor(diffMs / MS_PER_MINUTE);
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }

  const hours = Math.floor(diffMs / MS_PER_HOUR);
  if (hours < 24) {
    return `${hours}小时前`;
  }

  const days = Math.floor(diffMs / MS_PER_DAY);
  return `${days}天前`;
}
