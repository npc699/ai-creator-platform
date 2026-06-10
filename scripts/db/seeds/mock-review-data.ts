import crypto from "node:crypto";

import { QUALITY_DIMENSION_WEIGHTS } from "../../../lib/prompts/review";
import { REVIEW_PROMPT_VERSION } from "../../../lib/prompts/review";

type QualityDimensionKey = keyof typeof QUALITY_DIMENSION_WEIGHTS;

const DIMENSION_REASONS: Record<QualityDimensionKey, string[]> = {
  titleAppeal: [
    "标题点明读者收益，具备点击动机。",
    "关键词前置，符合平台搜索习惯。",
    "标题信息密度适中，未过度夸张。",
  ],
  completeness: [
    "问题背景、方法与结论完整，缺少明显断层。",
    "关键步骤与注意事项均有覆盖。",
    "正文信息足以支撑读者独立实践。",
  ],
  structure: [
    "段落层次清楚，过渡自然。",
    "先总后分，阅读路径清晰。",
    "小标题与段落分工明确，便于扫读。",
  ],
  readability: [
    "句式长度适中，专业词有解释。",
    "口语与书面语平衡，读起来不费力。",
    "标点与分段合理，屏幕阅读体验良好。",
  ],
  originality: [
    "结合个人经验与案例，不是纯模板拼接。",
    "观点有具体场景支撑，辨识度较高。",
    "提供了可复用的方法，而非泛泛而谈。",
  ],
  imageRelevance: [
    "正文以文字为主，配图需求不高，不影响理解。",
    "若补充示意图，可进一步提升信息传达效率。",
    "当前稿件不依赖图片也能完整阅读。",
  ],
};

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 浏览量与点赞量独立随机，避免高浏览必然高点赞。 */
export function randomEngagementMetrics() {
  return {
    viewCount: randomInt(680, 28_600),
    likeCount: randomInt(8, 1_480),
  };
}

function pickReason(key: QualityDimensionKey, salt: number) {
  const options = DIMENSION_REASONS[key];
  return options[salt % options.length] ?? options[0];
}

function computeQualityScore(
  dimensions: Record<QualityDimensionKey, { score: number; reason: string }>
) {
  const weighted =
    dimensions.titleAppeal.score * QUALITY_DIMENSION_WEIGHTS.titleAppeal +
    dimensions.completeness.score * QUALITY_DIMENSION_WEIGHTS.completeness +
    dimensions.structure.score * QUALITY_DIMENSION_WEIGHTS.structure +
    dimensions.readability.score * QUALITY_DIMENSION_WEIGHTS.readability +
    dimensions.originality.score * QUALITY_DIMENSION_WEIGHTS.originality +
    dimensions.imageRelevance.score * QUALITY_DIMENSION_WEIGHTS.imageRelevance;

  return Math.round(weighted * 10);
}

export function hashReviewContent(title: string, content: string, tags: string[] = []) {
  const tagsPart = [...tags].sort().join(",");
  return crypto
    .createHash("md5")
    .update(`${title.trim()}\n${content.trim()}\n${tagsPart}`)
    .digest("hex");
}

export function buildMockReviewBundle(input: {
  title: string;
  content: string;
  tags: string[];
  salt?: number;
}) {
  const salt = input.salt ?? randomInt(0, 999);
  const dimensionKeys = Object.keys(
    QUALITY_DIMENSION_WEIGHTS
  ) as QualityDimensionKey[];

  const dimensions = dimensionKeys.reduce(
    (acc, key, index) => {
      acc[key] = {
        score: randomInt(6, 9),
        reason: pickReason(key, salt + index),
      };
      return acc;
    },
    {} as Record<QualityDimensionKey, { score: number; reason: string }>
  );

  const qualityScore = computeQualityScore(dimensions);
  const contentHash = hashReviewContent(input.title, input.content, input.tags);

  const result = {
    promptVersion: REVIEW_PROMPT_VERSION,
    status: "PASSED" as const,
    safety: {
      passed: true,
      riskLevel: "none" as const,
      categories: [] as string[],
      reason: "未发现违反平台公开内容规范的安全风险。",
      suggestion: "内容可正常发布，建议后续更新时保持事实表述准确。",
    },
    quality: {
      dimensions,
      overallScore: qualityScore,
      summary: "整体质量良好，结构完整、可读性较好，适合在信息流中推荐。",
    },
    cacheHit: false,
    aiFailed: false,
    errorMessage: null,
  };

  return {
    contentHash,
    qualityScore,
    result,
  };
}

export function countTextChars(text: string) {
  return text.replace(/\s+/g, "").length;
}
