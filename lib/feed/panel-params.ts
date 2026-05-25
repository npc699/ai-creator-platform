import {
  buildHomeQuery,
  FEED_SORT_OPTIONS,
  parseFeedChannel,
  parseFeedSort,
} from "@/lib/feed/params";
import type { PromptScope, PromptSort } from "@/lib/prompts/query";
import {
  PROMPT_CATEGORY_LABELS,
  PROMPT_CATEGORY_SLUGS,
  normalizePromptCategorySlug,
} from "@/lib/prompts/category";

export const PUBLISHED_FILTERS = [
  "all",
  "online",
  "offline",
  "views",
  "likes",
] as const;
export type PublishedFilter = (typeof PUBLISHED_FILTERS)[number];

export const PUBLISHED_FILTER_OPTIONS: {
  filter: PublishedFilter;
  label: string;
}[] = [
  { filter: "all", label: "全部" },
  { filter: "online", label: "已上线" },
  { filter: "offline", label: "已下线" },
  { filter: "views", label: "最多浏览" },
  { filter: "likes", label: "最多点赞" },
];

export function parsePublishedFilter(value: string | null): PublishedFilter {
  if (
    value === "online" ||
    value === "offline" ||
    value === "views" ||
    value === "likes"
  ) {
    return value;
  }
  return "all";
}

export function buildPublishedQuery(options: {
  filter?: PublishedFilter;
}): string {
  const params = new URLSearchParams();
  const filter = options.filter ?? "all";
  if (filter !== "all") {
    params.set("filter", filter);
  }
  const query = params.toString();
  return query ? `/published?${query}` : "/published";
}

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
} from "@/lib/prompts/query";


/** 供 FeedSortNav 组装首页排序链接。 */
export function buildFeedSortOptions(
  channel: ReturnType<typeof parseFeedChannel>
) {
  return FEED_SORT_OPTIONS.map(({ sort, label }) => ({
    key: sort,
    label,
    href: buildHomeQuery({ channel, sort }),
  }));
}

export { buildHomeQuery, parseFeedChannel, parseFeedSort };
