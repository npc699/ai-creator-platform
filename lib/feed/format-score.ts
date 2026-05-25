/** 打分功能接入前的占位分值，仅草稿等无需质量分的场景使用。 */
export const DEFAULT_FEED_SCORE = 85;

export function formatFeedScoreLabel(score: number | null) {
  if (score === null) {
    return "待评分";
  }
  return `质量 ${score} 分`;
}
