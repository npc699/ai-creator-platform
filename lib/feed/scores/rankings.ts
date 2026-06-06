import {
  computeFeedQualityMultiplier,
  getPostAgeHours,
  type FeedScoreInput,
} from "./common";

/** 热点榜公式版本；调参后递增以使旧分页游标失效。 */
export const HOT_FORMULA_VERSION = 1;

export const HOT_LIKE_WEIGHT = 2;
export const HOT_VIEW_WEIGHT = 1;
export const HOT_TIME_GRAVITY = 1.25;
export const HOT_QUALITY_EXPONENT = 0.75;
export const HOT_MIN_AGE_HOURS = 0.5;

/** 热点综合分 = 互动分 × 质量乘数 / 文龄^gravity */
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

/** 爆文榜公式版本；调参后递增以使旧分页游标失效。 */
export const VIRAL_FORMULA_VERSION = 1;

export const VIRAL_LIKE_WEIGHT = 4;
export const VIRAL_VIEW_WEIGHT = 1;
export const VIRAL_TIME_GRAVITY = 1.1;
export const VIRAL_QUALITY_EXPONENT = 1.45;
export const VIRAL_MIN_AGE_HOURS = 0.5;

/** 爆文综合分 = 互动分 × 质量乘数² / 文龄^gravity */
export function computeViralScore(input: FeedScoreInput): number {
  const ageHours = getPostAgeHours(input, VIRAL_MIN_AGE_HOURS);
  const engagement =
    input.likeCount * VIRAL_LIKE_WEIGHT + input.viewCount * VIRAL_VIEW_WEIGHT;
  const qualityMultiplier = computeFeedQualityMultiplier(
    input.qualityScore,
    VIRAL_QUALITY_EXPONENT
  );
  return (
    (engagement * qualityMultiplier * qualityMultiplier) /
    ageHours ** VIRAL_TIME_GRAVITY
  );
}
