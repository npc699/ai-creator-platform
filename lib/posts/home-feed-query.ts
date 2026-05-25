import type { FeedChannelParam, FeedSort } from "@/lib/feed/params";
import type { FeedArticleItem } from "@/lib/feed/types";
import { prisma } from "@/lib/db";
import { mapPostToHomeFeedItem } from "@/lib/posts/feed-item";
import {
  buildHomeCursorFromPost,
  buildHomeCursorWhere,
  decodeHomeCursor,
  encodeHomeCursor,
  resolveHomePaginationMode,
} from "@/lib/posts/home-cursor";
import {
  fetchHomeFeedRecommendPage,
  isHomeRecommendFeed,
} from "@/lib/posts/home-feed-recommend-query";
import {
  buildHomeListOrderBy,
  buildHomeListWhere,
  getHomePageSize,
  MAX_HOME_PAGE_SIZE,
} from "@/lib/posts/home-list";
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
  tags: true,
  user: {
    select: {
      name: true,
      email: true,
      phone: true,
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

function clampPageSize(limit?: number) {
  const size = limit ?? getHomePageSize();
  return Math.min(Math.max(1, size), MAX_HOME_PAGE_SIZE);
}

/** 首页 Feed 分页查询，供 RSC 首屏与 /api/feed/home 共用。 */
export async function fetchHomeFeedPage(
  options: FetchHomeFeedPageOptions
): Promise<HomeFeedPageResult> {
  const limit = clampPageSize(options.limit);

  if (isHomeRecommendFeed(options.channel, options.sort)) {
    return fetchHomeFeedRecommendPage(options, limit);
  }

  const mode = resolveHomePaginationMode(options.channel, options.sort);
  const decodedCursor = decodeHomeCursor(options.cursor);
  const baseWhere = buildHomeListWhere(options.topic, options.userId);

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

  const likedPostIds = options.userId
    ? await getLikedPostIds(
        options.userId,
        pagePosts.map((post) => post.id)
      )
    : new Set<string>();

  const items: HomeFeedListItem[] = pagePosts.map((post) => ({
    ...mapPostToHomeFeedItem(post),
    href: buildPostHref(post.id, options.homeReturnPath),
    likedByViewer: likedPostIds.has(post.id),
    canLike: Boolean(options.userId),
  }));

  const lastPost = pagePosts[pagePosts.length - 1];
  const nextCursor =
    hasMore && lastPost
      ? encodeHomeCursor(buildHomeCursorFromPost(lastPost, mode))
      : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}
