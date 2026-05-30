import {
  computeFeedQualityMultiplier,
  getPostAgeHours,
  type FeedScoreInput,
} from "@/lib/feed/score-common";

/** 热点榜公式版本；调参后递增以使旧分页游标失效。 */
export const HOT_FORMULA_VERSION = 1;

/** 点赞在热点互动分中的权重。 */
export const HOT_LIKE_WEIGHT = 2;

/** 浏览在热点互动分中的权重（相对点赞略低）。 */
export const HOT_VIEW_WEIGHT = 1;

/** 时间衰减指数：热点榜偏重近期热度。 */
export const HOT_TIME_GRAVITY = 1.25;

/** 质量分指数：<1 时质量对排序影响较弱。 */
export const HOT_QUALITY_EXPONENT = 0.75;

export const HOT_MIN_AGE_HOURS = 0.5;

/**
 * 热点综合分 = 互动分 × 质量乘数 / 文龄^gravity
 * 互动分偏重浏览与点赞，质量乘数权重低于爆文榜。
 */
export function computeHotScore(input: FeedScoreInput): number {
  const ageHours = getPostAgeHours(input, HOT_MIN_AGE_HOURS);
  const engagement =
    input.likeCount * HOT_LIKE_WEIGHT + input.viewCount * HOT_VIEW_WEIGHT;
  const qualityMultiplier = computeFeedQualityMultiplier(
    input.qualityScore,
    HOT_QUALITY_EXPONENT
  );
  return (engagement * qualityMultiplier) / ageHours ** HOT_TIME_GRAVITY;
}
