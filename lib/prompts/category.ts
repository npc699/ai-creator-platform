import type { PromptCategory as PrismaPromptCategory } from "@/lib/generated/prisma/client";

/** URL / API 使用的小写 slug，与 Prisma enum 解耦。 */
export const PROMPT_CATEGORY_SLUGS = [
  "long-form",
  "short-post",
  "seeding",
  "product-review",
  "industry",
  "title-gen",
  "rewrite",
] as const;

export type PromptCategorySlug = (typeof PROMPT_CATEGORY_SLUGS)[number];

export const PROMPT_CATEGORY_LABELS: Record<PromptCategorySlug, string> = {
  "long-form": "长文写作",
  "short-post": "短图文",
  seeding: "种草内容",
  "product-review": "产品测评",
  industry: "行业分析",
  "title-gen": "标题生成",
  rewrite: "改写润色",
};

const SLUG_TO_PRISMA: Record<PromptCategorySlug, PrismaPromptCategory> = {
  "long-form": "LONG_FORM",
  "short-post": "SHORT_POST",
  seeding: "SEEDING",
  "product-review": "PRODUCT_REVIEW",
  industry: "INDUSTRY",
  "title-gen": "TITLE_GEN",
  rewrite: "REWRITE",
};

const PRISMA_TO_SLUG: Record<PrismaPromptCategory, PromptCategorySlug> = {
  LONG_FORM: "long-form",
  SHORT_POST: "short-post",
  SEEDING: "seeding",
  PRODUCT_REVIEW: "product-review",
  INDUSTRY: "industry",
  TITLE_GEN: "title-gen",
  REWRITE: "rewrite",
};

/** 旧版分类 slug，用于 URL 兼容。 */
const LEGACY_CATEGORY_SLUGS: Record<string, PromptCategorySlug> = {
  writing: "long-form",
  ops: "seeding",
  script: "rewrite",
};

export function normalizePromptCategorySlug(
  value: string | null
): PromptCategorySlug | null {
  if (!value) {
    return null;
  }

  if (PROMPT_CATEGORY_SLUGS.includes(value as PromptCategorySlug)) {
    return value as PromptCategorySlug;
  }

  return LEGACY_CATEGORY_SLUGS[value] ?? null;
}

export function slugToPrismaCategory(slug: PromptCategorySlug): PrismaPromptCategory {
  return SLUG_TO_PRISMA[slug];
}

export function prismaCategoryToSlug(
  category: PrismaPromptCategory
): PromptCategorySlug {
  return PRISMA_TO_SLUG[category];
}

export function getPromptCategoryLabel(slug: PromptCategorySlug): string {
  return PROMPT_CATEGORY_LABELS[slug];
}

export const DEFAULT_PROMPT_CATEGORY_SLUG: PromptCategorySlug = "long-form";
