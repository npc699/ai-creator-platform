import {
  buildHomeQuery,
  FEED_SORT_OPTIONS,
  parseFeedChannel,
  parseFeedSort,
} from "@/lib/feed/params";

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

export const PROMPT_CATEGORIES = ["all", "writing", "ops", "script"] as const;
export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export const PROMPT_CATEGORY_OPTIONS: {
  category: PromptCategory;
  label: string;
}[] = [
  { category: "all", label: "全部" },
  { category: "writing", label: "写作" },
  { category: "ops", label: "运营" },
  { category: "script", label: "脚本" },
];

export const ASSET_FILTERS = ["all", "image", "file"] as const;
export type AssetFilter = (typeof ASSET_FILTERS)[number];

export const ASSET_FILTER_OPTIONS: { filter: AssetFilter; label: string }[] = [
  { filter: "all", label: "全部" },
  { filter: "image", label: "图片" },
  { filter: "file", label: "文件" },
];

export function parsePromptCategory(value: string | null): PromptCategory {
  if (value === "writing" || value === "ops" || value === "script") {
    return value;
  }
  return "all";
}

export function parseAssetFilter(value: string | null): AssetFilter {
  if (value === "image" || value === "file") {
    return value;
  }
  return "all";
}

export function buildPromptsQuery(options: {
  category?: PromptCategory;
}): string {
  const params = new URLSearchParams();
  const category = options.category ?? "all";
  if (category !== "all") {
    params.set("category", category);
  }
  const query = params.toString();
  return query ? `/prompts?${query}` : "/prompts";
}

export function buildAssetsQuery(options: { filter?: AssetFilter }): string {
  const params = new URLSearchParams();
  const filter = options.filter ?? "all";
  if (filter !== "all") {
    params.set("filter", filter);
  }
  const query = params.toString();
  return query ? `/assets?${query}` : "/assets";
}

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
