/** 打分功能接入前的占位分值，真实数据接入后由接口返回替换。 */
export const DEFAULT_FEED_SCORE = 85;

export function formatFeedScoreLabel(score: number) {
  return `质量 ${score} 分`;
}
