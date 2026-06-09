import type { PromptScope, PromptSort } from "./query";
import {
  PROMPT_CATEGORY_LABELS,
  PROMPT_CATEGORY_SLUGS,
  normalizePromptCategorySlug,
} from "./category";

export const PROMPT_CATEGORIES = ["all", ...PROMPT_CATEGORY_SLUGS] as const;
export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export const PROMPT_CATEGORY_OPTIONS: {
  category: PromptCategory;
  label: string;
}[] = [
  { category: "all", label: "全部" },
  ...PROMPT_CATEGORY_SLUGS.map((slug) => ({
    category: slug,
    label: PROMPT_CATEGORY_LABELS[slug],
  })),
];

export function parsePromptCategory(value: string | null): PromptCategory {
  if (value === "all") {
    return "all";
  }

  const normalized = normalizePromptCategorySlug(value);
  return normalized ?? "all";
}

export function buildPromptsQuery(options: {
  scope?: PromptScope;
  category?: PromptCategory;
  sort?: PromptSort;
}): string {
  const params = new URLSearchParams();
  const scope = options.scope ?? "official";
  const category = options.category ?? "all";
  const sort = options.sort ?? "updated";

  if (scope !== "official") {
    params.set("scope", scope);
  }
  if (category !== "all") {
    params.set("category", category);
  }
  if (sort !== "updated") {
    params.set("sort", sort);
  }

  const query = params.toString();
  return query ? `/prompts?${query}` : "/prompts";
}

export {
  PROMPT_SCOPES,
  PROMPT_SCOPE_OPTIONS,
  PROMPT_SORTS,
  PROMPT_SORT_OPTIONS,
  parsePromptScope,
  parsePromptSort,
  sortPrompts,
  getPromptEmptyMessage,
  type PromptScope,
  type PromptSort,
} from "./query";
