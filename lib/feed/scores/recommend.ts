/** 点赞在互动分中的权重（相对浏览量）。 */
export const RECOMMEND_LIKE_WEIGHT = 3;

/** 发布时间衰减指数：越大则旧文掉得越快（类似 Hacker News gravity）。 */
export const RECOMMEND_TIME_GRAVITY = 1.15;

/** 最小「文龄」小时数，避免刚发布文章分母过小导致分数爆炸。 */
export const RECOMMEND_MIN_AGE_HOURS = 0.5;

/**
 * 无质量分（待审核）时折合的分值；低于及格线以体现「推荐权重较低」。
 * 与 PostReviewPendingBanner 文案一致。
 */
export const RECOMMEND_PENDING_QUALITY_SCORE = 45;

/** 质量分指数：>1 时高分内容相对优势更明显。 */
export const RECOMMEND_QUALITY_EXPONENT = 1.2;

/** 推荐分公式版本；变更乘数或权重时递增，使旧分页游标失效。 */
export const RECOMMEND_FORMULA_VERSION = 2;

const MS_PER_HOUR = 3_600_000;

export type RecommendScoreInput = {
  likeCount: number;
  viewCount: number;
  publishedAt: Date | null;
  updatedAt: Date;
  qualityScore?: number | null;
  /** 测试或回放时可注入固定时间 */
  now?: Date;
};

/** 将 0–100 质量分映射为推荐乘数（0–1）。 */
export function computeQualityRecommendMultiplier(
  qualityScore: number | null | undefined
): number {
  const score = qualityScore ?? RECOMMEND_PENDING_QUALITY_SCORE;
  const normalized = Math.max(0, Math.min(100, score)) / 100;
  return normalized ** RECOMMEND_QUALITY_EXPONENT;
}

/**
 * 推荐综合分 = 互动分 × 质量乘数 / 文龄^gravity
 * 互动分 = 点赞×权重 + 浏览；质量乘数来自 AI 质量分（待审核用折合分）。
 */
export function computeHomeRecommendScore(input: RecommendScoreInput): number {
  const now = input.now ?? new Date();
  const published = input.publishedAt ?? input.updatedAt;
  const ageHours = Math.max(
    (now.getTime() - published.getTime()) / MS_PER_HOUR,
    RECOMMEND_MIN_AGE_HOURS
  );
  const engagement =
    input.likeCount * RECOMMEND_LIKE_WEIGHT + input.viewCount;
  const qualityMultiplier = computeQualityRecommendMultiplier(
    input.qualityScore
  );
  return (engagement * qualityMultiplier) / ageHours ** RECOMMEND_TIME_GRAVITY;
}

/** 与 computeQualityRecommendMultiplier 一致的 PostgreSQL 表达式片段。 */
export function qualityRecommendMultiplierSql(alias = "p") {
  return `POWER(
    GREATEST(0, LEAST(100, COALESCE(${alias}."qualityScore", ${RECOMMEND_PENDING_QUALITY_SCORE}))) / 100.0,
    ${RECOMMEND_QUALITY_EXPONENT}
  )`;
}

/**
 * 与 computeHomeRecommendScore 一致的 PostgreSQL 表达式。
 * @param asOf 分页会话固定参考时间，避免每次请求用 NOW() 导致分数漂移与重复行
 */
export function recommendScoreSql(alias = "p", asOf: Date) {
  const asOfIso = asOf.toISOString();
  const qualityMultiplier = qualityRecommendMultiplierSql(alias);
  return `(
    (${alias}."likeCount" * ${RECOMMEND_LIKE_WEIGHT} + ${alias}."viewCount")
    * ${qualityMultiplier}
  ) / POWER(
      GREATEST(
        EXTRACT(EPOCH FROM ('${asOfIso}'::timestamptz - COALESCE(${alias}."publishedAt", ${alias}."updatedAt"))) / 3600.0,
        ${RECOMMEND_MIN_AGE_HOURS}
      ),
      ${RECOMMEND_TIME_GRAVITY}
    )`;
}
