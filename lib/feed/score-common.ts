import { RECOMMEND_PENDING_QUALITY_SCORE } from "@/lib/posts/home-recommend-score";

const MS_PER_HOUR = 3_600_000;

export type FeedScoreInput = {
  likeCount: number;
  viewCount: number;
  publishedAt: Date | null;
  updatedAt: Date;
  qualityScore?: number | null;
  now?: Date;
};

export function getPostAgeHours(input: FeedScoreInput, minAgeHours: number) {
  const now = input.now ?? new Date();
  const published = input.publishedAt ?? input.updatedAt;
  return Math.max(
    (now.getTime() - published.getTime()) / MS_PER_HOUR,
    minAgeHours
  );
}

/** 将 0–100 质量分映射为乘数，指数越大则高分内容优势越明显。 */
export function computeFeedQualityMultiplier(
  qualityScore: number | null | undefined,
  exponent: number
) {
  const score = qualityScore ?? RECOMMEND_PENDING_QUALITY_SCORE;
  const normalized = Math.max(0, Math.min(100, score)) / 100;
  return normalized ** exponent;
}
