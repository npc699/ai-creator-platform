const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

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
