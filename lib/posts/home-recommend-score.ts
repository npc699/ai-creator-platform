/** 点赞在互动分中的权重（相对浏览量）。 */
export const RECOMMEND_LIKE_WEIGHT = 3;

/** 发布时间衰减指数：越大则旧文掉得越快（类似 Hacker News gravity）。 */
export const RECOMMEND_TIME_GRAVITY = 1.15;

/** 最小「文龄」小时数，避免刚发布文章分母过小导致分数爆炸。 */
export const RECOMMEND_MIN_AGE_HOURS = 0.5;

const MS_PER_HOUR = 3_600_000;

export type RecommendScoreInput = {
  likeCount: number;
  viewCount: number;
  publishedAt: Date | null;
  updatedAt: Date;
  /** 测试或回放时可注入固定时间 */
  now?: Date;
};

/**
 * 推荐综合分 = 互动分 / 文龄^gravity
 * 互动分 = 点赞×权重 + 浏览；文龄自 publishedAt（无则 updatedAt）起算。
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
  return engagement / ageHours ** RECOMMEND_TIME_GRAVITY;
}

/**
 * 与 computeHomeRecommendScore 一致的 PostgreSQL 表达式。
 * @param asOf 分页会话固定参考时间，避免每次请求用 NOW() 导致分数漂移与重复行
 */
export function recommendScoreSql(alias = "p", asOf: Date) {
  const asOfIso = asOf.toISOString();
  return `(
    (${alias}."likeCount" * ${RECOMMEND_LIKE_WEIGHT} + ${alias}."viewCount") / POWER(
      GREATEST(
        EXTRACT(EPOCH FROM ('${asOfIso}'::timestamptz - COALESCE(${alias}."publishedAt", ${alias}."updatedAt"))) / 3600.0,
        ${RECOMMEND_MIN_AGE_HOURS}
      ),
      ${RECOMMEND_TIME_GRAVITY}
    )
  )`;
}
