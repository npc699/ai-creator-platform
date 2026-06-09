import {
  buildFeedFirstPageCacheKey,
  getCachedFeedFirstPage,
  getFeedCacheTtl,
  setCachedFeedFirstPage,
} from "@/lib/feed/cache";
import { findLeaderboardIneligiblePostIds } from "@/lib/feed/cache";
import type { FeedChannel, FeedChannelParam, FeedSort } from "@/lib/feed/params";
import { mapPostToHomeFeedItem } from "@/lib/feed/home/map-item";
import type { FeedArticleItem } from "@/lib/posts/list-types";
import { prisma } from "@/lib/db";
import {
  buildHomeCursorFromPost,
  buildHomeCursorWhere,
  decodeHomeCursor,
  encodeHomeCursor,
  resolveHomePaginationMode,
} from "@/lib/feed/home/cursor";
import {
  fetchHomeFeedRecommendPage,
  isHomeRecommendFeed,
} from "@/lib/feed/home/recommend-query";
import {
  buildHomeListOrderBy,
  buildHomeListWhere,
  getHomePageSize,
  isPublicLeaderboardChannel,
  MAX_HOME_PAGE_SIZE,
} from "@/lib/feed/home/list";
import { getLikedPostIds } from "@/lib/posts/metrics";
import { buildPostHref } from "@/lib/posts/reader-navigation";

const homePostSelect = {
  id: true,
  title: true,
  content: true,
  status: true,
  publishedAt: true,
  updatedAt: true,
  viewCount: true,
  likeCount: true,
  hotScore: true,
  viralScore: true,
  tags: true,
  coverUrl: true,
  qualityScore: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
    },
  },
} as const;

export type HomeFeedListItem = FeedArticleItem & {
  likedByViewer: boolean;
  canLike: boolean;
};

export type FetchHomeFeedPageOptions = {
  channel: FeedChannelParam;
  sort: FeedSort;
  topic: string | null;
  userId?: string | null;
  homeReturnPath: string;
  cursor?: string | null;
  limit?: number;
};

export type HomeFeedPageResult = {
  items: HomeFeedListItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

function clampPageSize(channel: FeedChannelParam, limit?: number) {
  const size = limit ?? getHomePageSize(channel);
  return Math.min(Math.max(1, size), MAX_HOME_PAGE_SIZE);
}

function isChannelFeed(channel: FeedChannelParam): channel is FeedChannel {
  return channel === "hot" || channel === "viral";
}

type HomePostRow = Awaited<
  ReturnType<
    typeof prisma.post.findMany<{
      select: typeof homePostSelect;
    }>
  >
>[number];

/** 榜单首屏缓存为全站共用，读缓存后按当前用户刷新点赞态与链接。 */
async function hydrateFeedPageWithViewer(
  result: HomeFeedPageResult,
  options: {
    userId?: string | null;
    homeReturnPath: string;
  }
): Promise<HomeFeedPageResult> {
  const postIds = result.items.map((item) => item.id);
  const likedPostIds = options.userId
    ? await getLikedPostIds(options.userId, postIds)
    : new Set<string>();

  return {
    ...result,
    items: result.items.map((item) => ({
      ...item,
      href: buildPostHref(item.id, options.homeReturnPath),
      likedByViewer: likedPostIds.has(item.id),
      canLike: Boolean(options.userId),
    })),
  };
}

async function mapPostsToFeedItems(
  pagePosts: HomePostRow[],
  options: {
    userId?: string | null;
    homeReturnPath: string;
    channel: FeedChannelParam;
    rankOffset?: number;
  }
): Promise<HomeFeedListItem[]> {
  const postIds = pagePosts.map((post) => post.id);
  const likedPostIds = options.userId
    ? await getLikedPostIds(options.userId, postIds)
    : new Set<string>();
  return pagePosts.map((post, index) => ({
    ...mapPostToHomeFeedItem(post, {
      showRank: options.channel === "hot",
      rank: options.channel === "hot" ? (options.rankOffset ?? 0) + index + 1 : undefined,
      channel: options.channel,
    }),
    href: buildPostHref(post.id, options.homeReturnPath),
    likedByViewer: likedPostIds.has(post.id),
    canLike: Boolean(options.userId),
  }));
}

/** 首页 Feed 分页查询，供 RSC 首屏与 /api/feed/home 共用。 */
export async function fetchHomeFeedPage(
  options: FetchHomeFeedPageOptions
): Promise<HomeFeedPageResult> {
  const limit = clampPageSize(options.channel, options.limit);
  const isFirstPage = !options.cursor?.trim();

  // 公开榜缓存全站共用，不按登录用户分片（避免每人看到不同榜单）
  const leaderboardCacheViewerId = isPublicLeaderboardChannel(options.channel)
    ? null
    : options.userId ?? null;

  if (isFirstPage && isChannelFeed(options.channel)) {
    const cacheKey = buildFeedFirstPageCacheKey({
      channel: options.channel,
      topic: options.topic,
      excludeUserId: leaderboardCacheViewerId,
      limit,
    });
    const cached = await getCachedFeedFirstPage(cacheKey);
    if (cached) {
      const ineligibleIds = await findLeaderboardIneligiblePostIds(
        cached.items.map((item) => item.id)
      );
      if (ineligibleIds.size === 0) {
        return hydrateFeedPageWithViewer(cached, {
          userId: options.userId,
          homeReturnPath: options.homeReturnPath,
        });
      }
      // 缓存含已下线等不可上榜文章时丢弃缓存，改查库
    }
  }

  if (isHomeRecommendFeed(options.channel, options.sort)) {
    return fetchHomeFeedRecommendPage(options, limit);
  }

  const mode = resolveHomePaginationMode(options.channel, options.sort);
  const decodedCursor = decodeHomeCursor(options.cursor);
  const baseWhere = buildHomeListWhere(
    options.topic,
    options.userId,
    options.channel
  );

  const where =
    decodedCursor && decodedCursor.mode === mode
      ? { AND: [baseWhere, buildHomeCursorWhere(decodedCursor)] }
      : baseWhere;

  const posts = await prisma.post.findMany({
    where,
    orderBy: buildHomeListOrderBy(options.channel, options.sort),
    take: limit + 1,
    select: homePostSelect,
  });

  const hasMore = posts.length > limit;
  const pagePosts = hasMore ? posts.slice(0, limit) : posts;

  const hotRankOffset =
    options.channel === "hot" && decodedCursor?.mode === "hot"
      ? (decodedCursor.offset ?? 0)
      : 0;

  const items = await mapPostsToFeedItems(pagePosts, {
    userId: options.userId,
    homeReturnPath: options.homeReturnPath,
    channel: options.channel,
    rankOffset: options.channel === "hot" ? hotRankOffset : undefined,
  });

  const lastPost = pagePosts[pagePosts.length - 1];
  const nextCursor =
    hasMore && lastPost
      ? encodeHomeCursor(
          buildHomeCursorFromPost(lastPost, mode, {
            hotOffset:
              options.channel === "hot"
                ? hotRankOffset + pagePosts.length
                : undefined,
          })
        )
      : null;

  const result: HomeFeedPageResult = {
    items,
    nextCursor,
    hasMore,
  };

  if (isFirstPage && isChannelFeed(options.channel)) {
    const cacheKey = buildFeedFirstPageCacheKey({
      channel: options.channel,
      topic: options.topic,
      excludeUserId: leaderboardCacheViewerId,
      limit,
    });
    // 写入缓存时去掉用户态，避免下一位读者读到他人的点赞状态。
    const cachePayload: HomeFeedPageResult = {
      ...result,
      items: result.items.map((item) => ({
        ...item,
        likedByViewer: false,
        canLike: false,
      })),
    };
    await setCachedFeedFirstPage(
      cacheKey,
      cachePayload,
      getFeedCacheTtl(options.channel)
    );
  }

  return result;
}
