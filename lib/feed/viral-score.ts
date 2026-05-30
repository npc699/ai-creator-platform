import {
  computeFeedQualityMultiplier,
  getPostAgeHours,
  type FeedScoreInput,
} from "@/lib/feed/score-common";

/** 爆文榜公式版本；调参后递增以使旧分页游标失效。 */
export const VIRAL_FORMULA_VERSION = 1;

/** 点赞在爆文互动分中的权重。 */
export const VIRAL_LIKE_WEIGHT = 4;

export const VIRAL_VIEW_WEIGHT = 1;

/** 时间衰减略缓，让高质量内容在榜内停留更久。 */
export const VIRAL_TIME_GRAVITY = 1.1;

/** 质量分指数：>1 时高分内容相对优势更明显。 */
export const VIRAL_QUALITY_EXPONENT = 1.45;

export const VIRAL_MIN_AGE_HOURS = 0.5;

/**
 * 爆文综合分 = 互动分 × 质量乘数² / 文龄^gravity
 * 质量乘数平方使高分内容在爆文榜中更突出。
 */
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
