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
