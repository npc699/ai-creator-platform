/** 热点/爆文榜单只统计近 N 天内发布的文章，避免老文靠累计互动长期霸榜。 */
export const FEED_RANKING_WINDOW_DAYS = 7;

export const FEED_RANKING_WINDOW_MS =
  FEED_RANKING_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export function getFeedRankingSince(now = new Date()) {
  return new Date(now.getTime() - FEED_RANKING_WINDOW_MS);
}
