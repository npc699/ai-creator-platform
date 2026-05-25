import { PostStatus, type Prisma } from "@/lib/generated/prisma/client";
import type { FeedChannelParam, FeedSort } from "@/lib/feed/params";

/** 侧栏话题 id 与文章 tags 的映射，用于 ?topic= 筛选。 */
export const HOME_TOPIC_TAGS: Record<string, string[]> = {
  "ai-writing-tools": ["AI工具", "内容创作", "Prompt", "长文写作", "工作流", "排版"],
  "short-video-script": ["短视频", "脚本", "直播", "切片"],
  "wechat-title-formulas": ["公众号", "标题", "选题"],
  "content-monetization": ["种草", "运营", "互动", "私域"],
  "growth-30d-review": ["运营", "本地生活", "电商"],
};

/** 首页 Feed 每页条数（SSR 首屏与 API 一致）。 */
export const HOME_PAGE_SIZE = 20;

/** API 单次请求上限，防止滥用。 */
export const MAX_HOME_PAGE_SIZE = 30;

const HOME_LIST_LIMIT = 50;

/** 首页仅展示全站已上线（PUBLISHED）文章；登录用户不展示自己的文章。 */
export function buildHomeListWhere(
  topic: string | null,
  excludeUserId?: string | null
): Prisma.PostWhereInput {
  const base: Prisma.PostWhereInput = {
    status: PostStatus.PUBLISHED,
    ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
  };

  if (!topic) {
    return base;
  }

  const tagCandidates = HOME_TOPIC_TAGS[topic];
  if (!tagCandidates?.length) {
    return base;
  }

  return {
    ...base,
    tags: { hasSome: tagCandidates },
  };
}

export function buildHomeListOrderBy(
  channel: FeedChannelParam,
  sort: FeedSort
): Prisma.PostOrderByWithRelationInput[] {
  if (channel === "hot") {
    return [{ viewCount: "desc" }, { publishedAt: "desc" }];
  }

  if (channel === "viral") {
    return [{ likeCount: "desc" }, { publishedAt: "desc" }];
  }

  switch (sort) {
    case "latest":
      return [{ publishedAt: "desc" }];
    case "likes":
      return [{ likeCount: "desc" }, { publishedAt: "desc" }];
    case "views":
      return [{ viewCount: "desc" }, { publishedAt: "desc" }];
    default:
      // 推荐排序由 home-feed-query 按综合分 SQL 处理，此处仅占位
      return [{ publishedAt: "desc" }];
  }
}

export function getHomePageSize() {
  return HOME_PAGE_SIZE;
}

/** @deprecated 首页已改为分页，保留供其他调用方过渡 */
export function getHomeListLimit() {
  return HOME_LIST_LIMIT;
}

export function getHomeEmptyMessage(options: {
  channel: FeedChannelParam;
  topic: string | null;
}) {
  if (options.topic && HOME_TOPIC_TAGS[options.topic]) {
    return "该话题下暂无已发布文章";
  }

  if (options.channel === "hot") {
    return "热点榜单暂无文章";
  }

  if (options.channel === "viral") {
    return "爆文榜单暂无文章";
  }

  return "暂无已发布文章，去创作第一篇吧";
}
