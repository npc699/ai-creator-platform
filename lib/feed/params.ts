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

/** 频道页 Header 文案，供 ChannelFeedHeader 与侧栏统一引用。 */
export const CHANNEL_META: Record<
  FeedChannel,
  { title: string; subtitle: string; iconTone: "amber" | "emerald" }
> = {
  hot: {
    title: "热点榜单",
    subtitle: "实时热度排行 · 每 10 分钟更新",
    iconTone: "amber",
  },
  viral: {
    title: "爆文榜单",
    subtitle: "综合质量排行 · 近 7 天优质内容",
    iconTone: "emerald",
  },
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
