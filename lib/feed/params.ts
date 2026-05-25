/** 侧栏切换的内容频道（首页无 channel 参数） */
export type FeedChannel = "hot" | "viral";

export type FeedChannelParam = FeedChannel | null;

/** Feed 顶部筛选 / 排序模式 */
export const FEED_SORTS = ["recommend", "latest", "likes", "views"] as const;

export type FeedSort = (typeof FEED_SORTS)[number];

export const FEED_SORT_OPTIONS: { sort: FeedSort; label: string }[] = [
  { sort: "recommend", label: "推荐" },
  { sort: "latest", label: "最新" },
  { sort: "likes", label: "最多点赞" },
  { sort: "views", label: "最多浏览" },
];

const CHANNEL_LABELS: Record<FeedChannel, string> = {
  hot: "热点榜单",
  viral: "爆文榜单",
};

export function parseFeedChannel(value: string | null): FeedChannelParam {
  if (value === "hot" || value === "viral") return value;
  return null;
}

export function parseFeedSort(value: string | null): FeedSort {
  if (value === "latest" || value === "likes" || value === "views") {
    return value;
  }
  return "recommend";
}

/** 组装首页 URL，保留 channel、sort、topic 组合（供侧栏、Feed、话题链接联动） */
export function buildHomeQuery(options: {
  channel?: FeedChannelParam;
  sort?: FeedSort;
  /** 话题标识，后期可改为独立路由 /topics/[id] */
  topic?: string;
}): string {
  const params = new URLSearchParams();
  if (options.channel) params.set("channel", options.channel);
  const sort = options.sort ?? "recommend";
  if (sort !== "recommend") params.set("sort", sort);
  if (options.topic) params.set("topic", options.topic);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

