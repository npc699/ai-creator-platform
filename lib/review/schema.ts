import { z } from "zod";

export const reviewRiskLevelSchema = z.enum(["high", "medium", "low", "none"]);
export const reviewStatusSchema = z.enum([
  "PENDING",
  "PASSED",
  "REJECTED",
]);
export const reviewTypeSchema = z.enum(["PUBLISH", "UPDATE", "MANUAL", "FIX"]);

export const reviewCategorySchema = z.enum([
  "pornography",
  "gambling",
  "drugs",
  "political_sensitive",
  "harassment",
  "vulgar",
  "misinformation",
]);

export const qualityDimensionKeySchema = z.enum([
  "titleAppeal",
  "completeness",
  "structure",
  "readability",
  "originality",
  "imageRelevance",
]);

export const qualityDimensionScoreSchema = z.object({
  score: z.number().min(0).max(10),
  reason: z.string().min(1).max(300),
});

export const qualityScoreSchema = z.object({
  dimensions: z.object({
    titleAppeal: qualityDimensionScoreSchema,
    completeness: qualityDimensionScoreSchema,
    structure: qualityDimensionScoreSchema,
    readability: qualityDimensionScoreSchema,
    originality: qualityDimensionScoreSchema,
    imageRelevance: qualityDimensionScoreSchema,
  }),
  overallScore: z.number().min(0).max(100),
  summary: z.string().min(1).max(500),
});

export const safetyReviewSchema = z.object({
  passed: z.boolean(),
  riskLevel: reviewRiskLevelSchema,
  categories: z.array(reviewCategorySchema).default([]),
  reason: z.string().min(1).max(800),
  suggestion: z.string().min(1).max(800),
});

export const aiReviewResponseSchema = z.object({
  safety: safetyReviewSchema,
  quality: qualityScoreSchema,
});

export const normalizedReviewResultSchema = z.object({
  status: reviewStatusSchema,
  contentHash: z.string().min(1),
  safety: safetyReviewSchema,
  quality: qualityScoreSchema,
  qualityScore: z.number().min(0).max(100).nullable(),
  cacheHit: z.boolean(),
  aiFailed: z.boolean(),
  errorMessage: z.string().optional(),
});

export const reviewContentRequestSchema = z.object({
  postId: z.string().trim().min(1).optional().nullable(),
  draftId: z.string().trim().min(1).optional().nullable(),
  title: z.string().trim().min(1, "标题不能为空").max(100, "标题不能超过 100 字"),
  content: z.string().min(1, "正文不能为空").max(1_000_000, "正文超出大小限制"),
  tags: z.array(z.string()).optional(),
});

export const reviewFixRequestSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(100, "标题不能超过 100 字"),
  content: z.string().min(1, "正文不能为空").max(1_000_000, "正文超出大小限制"),
  reason: z.string().trim().min(1, "违规原因不能为空").max(800, "违规原因过长"),
  categories: z.array(reviewCategorySchema).default([]),
});

export const compliantRewriteResponseSchema = z.object({
  title: z.string().trim().min(1).max(100),
  content: z.string().min(1).max(1_000_000),
  summary: z.string().min(1).max(500),
});

export type ReviewRiskLevel = z.infer<typeof reviewRiskLevelSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type ReviewType = z.infer<typeof reviewTypeSchema>;
export type ReviewCategory = z.infer<typeof reviewCategorySchema>;
export type QualityScoreResult = z.infer<typeof qualityScoreSchema>;
export type SafetyReviewResult = z.infer<typeof safetyReviewSchema>;
export type AiReviewResponse = z.infer<typeof aiReviewResponseSchema>;
export type NormalizedReviewResult = z.infer<typeof normalizedReviewResultSchema>;
export type ReviewContentRequest = z.infer<typeof reviewContentRequestSchema>;
export type ReviewFixRequest = z.infer<typeof reviewFixRequestSchema>;
export type CompliantRewriteResponse = z.infer<typeof compliantRewriteResponseSchema>;
