import "server-only";

import crypto from "node:crypto";

import { chatArk } from "@/lib/ai";
import { getRedis } from "@/lib/db";
import {
  buildCompliantRewriteSystemPrompt,
  buildCompliantRewriteUserPrompt,
  buildReviewSystemPrompt,
  buildReviewUserPrompt,
  QUALITY_DIMENSION_WEIGHTS,
  REVIEW_PROMPT_VERSION,
} from "@/lib/prompts/review";
import {
  aiReviewResponseSchema,
  compliantRewriteResponseSchema,
  type AiReviewResponse,
  type CompliantRewriteResponse,
  type NormalizedReviewResult,
  type ReviewRiskLevel,
  type ReviewStatus,
  type ReviewType,
} from "@/lib/review/schema";

const REVIEW_CACHE_TTL_SECONDS = 60 * 60;
const REVIEW_TIMEOUT_MS = 25_000;
const FIX_TIMEOUT_MS = 30_000;

type ReviewContentInput = {
  title: string;
  content: string;
  tags?: string[];
  postId?: string | null;
  draftId?: string | null;
  userId?: string | null;
  reviewType?: ReviewType;
};

type GenerateCompliantContentInput = {
  title: string;
  content: string;
  reason: string;
  categories: string[];
};

function stripHtmlText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countImages(html: string) {
  return (html.match(/<img\b/gi) ?? []).length;
}

export function hashReviewContent(title: string, content: string, tags: string[] = []) {
  const tagsPart = [...tags].sort().join(",");
  return crypto
    .createHash("md5")
    .update(`${title.trim()}\n${content.trim()}\n${tagsPart}`)
    .digest("hex");
}

function getCacheKey(contentHash: string) {
  return `review:hash:${contentHash}`;
}

function extractJsonText(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  return trimmed;
}

async function withTimeout<T>(timeoutMs: number, run: (signal: AbortSignal) => Promise<T>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

function normalizeOverallScore(review: AiReviewResponse) {
  const weighted =
    review.quality.dimensions.titleAppeal.score * QUALITY_DIMENSION_WEIGHTS.titleAppeal +
    review.quality.dimensions.completeness.score * QUALITY_DIMENSION_WEIGHTS.completeness +
    review.quality.dimensions.structure.score * QUALITY_DIMENSION_WEIGHTS.structure +
    review.quality.dimensions.readability.score * QUALITY_DIMENSION_WEIGHTS.readability +
    review.quality.dimensions.originality.score * QUALITY_DIMENSION_WEIGHTS.originality +
    review.quality.dimensions.imageRelevance.score *
      QUALITY_DIMENSION_WEIGHTS.imageRelevance;

  const weightedScore = Math.round(weighted * 10);
  const modelScore = Math.round(review.quality.overallScore);

  // 模型综合分偏离权重计算过大时，以本地权重为准，保证排序口径稳定。
  return Math.abs(modelScore - weightedScore) > 12 ? weightedScore : modelScore;
}

function statusFromSafety(safety: AiReviewResponse["safety"]): ReviewStatus {
  if (safety.riskLevel === "high" || !safety.passed) {
    return "REJECTED";
  }

  return "PASSED";
}

function normalizeReview(
  contentHash: string,
  review: AiReviewResponse,
  cacheHit: boolean
): NormalizedReviewResult {
  const qualityScore = normalizeOverallScore(review);

  return {
    status: statusFromSafety(review.safety),
    contentHash,
    safety: review.safety,
    quality: {
      ...review.quality,
      overallScore: qualityScore,
    },
    qualityScore,
    cacheHit,
    aiFailed: false,
  };
}

function buildPendingReview(contentHash: string, error: unknown): NormalizedReviewResult {
  const message = error instanceof Error ? error.message : "AI 审核失败";

  return {
    status: "PENDING",
    contentHash,
    safety: {
      passed: true,
      riskLevel: "none",
      categories: [],
      reason: "AI 审核暂不可用，已进入待审核状态",
      suggestion: "内容已暂存为待审核，建议稍后重新触发审核",
    },
    quality: {
      dimensions: {
        titleAppeal: { score: 0, reason: "待审核" },
        completeness: { score: 0, reason: "待审核" },
        structure: { score: 0, reason: "待审核" },
        readability: { score: 0, reason: "待审核" },
        originality: { score: 0, reason: "待审核" },
        imageRelevance: { score: 0, reason: "待审核" },
      },
      overallScore: 0,
      summary: "AI 审核失败，暂不生成质量分",
    },
    qualityScore: null,
    cacheHit: false,
    aiFailed: true,
    errorMessage: message,
  };
}

async function readCachedReview(contentHash: string) {
  try {
    const client = await getRedis();
    const cached = await client.get(getCacheKey(contentHash));
    if (!cached) {
      return null;
    }

    const parsed = aiReviewResponseSchema.safeParse(JSON.parse(cached));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function writeCachedReview(contentHash: string, review: AiReviewResponse) {
  try {
    const client = await getRedis();
    await client.setEx(
      getCacheKey(contentHash),
      REVIEW_CACHE_TTL_SECONDS,
      JSON.stringify(review)
    );
  } catch {
    // 缓存失败不能影响发布审核主流程。
  }
}

async function requestAiReview(input: ReviewContentInput) {
  const plainText = stripHtmlText(input.content);
  const messages = [
    { role: "system" as const, content: buildReviewSystemPrompt() },
    {
      role: "user" as const,
      content: buildReviewUserPrompt({
        title: input.title,
        plainText,
        html: input.content,
        imageCount: countImages(input.content),
        tags: input.tags ?? [],
      }),
    },
  ];

  const raw = await withTimeout(REVIEW_TIMEOUT_MS, (signal) =>
    chatArk({ messages, signal, temperature: 0 })
  );
  const parsed = aiReviewResponseSchema.safeParse(JSON.parse(extractJsonText(raw)));

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "AI 审核返回格式异常");
  }

  return parsed.data;
}

export async function reviewContent(
  input: ReviewContentInput
): Promise<NormalizedReviewResult> {
  const contentHash = hashReviewContent(input.title, input.content, input.tags);

  const cached = await readCachedReview(contentHash);
  if (cached) {
    return normalizeReview(contentHash, cached, true);
  }

  try {
    const review = await requestAiReview(input);
    await writeCachedReview(contentHash, review);
    return normalizeReview(contentHash, review, false);
  } catch (error) {
    return buildPendingReview(contentHash, error);
  }
}

export async function generateCompliantContent(
  input: GenerateCompliantContentInput
): Promise<CompliantRewriteResponse> {
  const messages = [
    { role: "system" as const, content: buildCompliantRewriteSystemPrompt() },
    { role: "user" as const, content: buildCompliantRewriteUserPrompt(input) },
  ];

  const raw = await withTimeout(FIX_TIMEOUT_MS, (signal) =>
    chatArk({ messages, signal, temperature: 0.2 })
  );
  const parsed = compliantRewriteResponseSchema.safeParse(
    JSON.parse(extractJsonText(raw))
  );

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "合规改写返回格式异常");
  }

  return parsed.data;
}

export function toPrismaReviewRiskLevel(level: ReviewRiskLevel) {
  return level.toUpperCase() as "HIGH" | "MEDIUM" | "LOW" | "NONE";
}

export function buildReviewRecordResult(result: NormalizedReviewResult) {
  return {
    promptVersion: REVIEW_PROMPT_VERSION,
    status: result.status,
    safety: result.safety,
    quality: result.quality,
    cacheHit: result.cacheHit,
    aiFailed: result.aiFailed,
    errorMessage: result.errorMessage ?? null,
  };
}
