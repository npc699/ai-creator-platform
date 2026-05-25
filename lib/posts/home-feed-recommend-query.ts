import { Prisma } from "@/lib/generated/prisma/client";
import { PostStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { FeedChannelParam, FeedSort } from "@/lib/feed/params";
import { mapPostToHomeFeedItem } from "@/lib/posts/feed-item";
import {
  buildHomeCursorFromPost,
  decodeHomeCursor,
  encodeHomeCursor,
} from "@/lib/posts/home-cursor";
import type { FetchHomeFeedPageOptions, HomeFeedListItem } from "@/lib/posts/home-feed-query";
import { HOME_TOPIC_TAGS } from "@/lib/posts/home-list";
import { recommendScoreSql } from "@/lib/posts/home-recommend-score";
import { getLikedPostIds } from "@/lib/posts/metrics";
import { buildPostHref } from "@/lib/posts/reader-navigation";

type RecommendFeedRow = {
  id: string;
  title: string;
  content: string;
  status: PostStatus;
  publishedAt: Date | null;
  updatedAt: Date;
  viewCount: number;
  likeCount: number;
  tags: string[];
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  recommendScore: number;
};

function mapRecommendRow(row: RecommendFeedRow) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    viewCount: row.viewCount,
    likeCount: row.likeCount,
    tags: row.tags,
    user: {
      name: row.user_name,
      email: row.user_email,
      phone: row.user_phone,
    },
  };
}

function buildTopicTagSql(topic: string | null) {
  const tags = topic ? HOME_TOPIC_TAGS[topic] : undefined;
  if (!tags?.length) {
    return Prisma.empty;
  }
  return Prisma.sql`AND p.tags && ${tags}::text[]`;
}

/** 推荐 Tab：按综合分（互动 + 时间衰减）排序并分页。 */
export async function fetchHomeFeedRecommendPage(
  options: FetchHomeFeedPageOptions,
  limit: number
) {
  const decodedCursor = decodeHomeCursor(options.cursor);
  const scoreAsOf =
    decodedCursor?.mode === "recommend"
      ? new Date(decodedCursor.asOf)
      : new Date();
  const scoreExpr = recommendScoreSql("p", scoreAsOf);

  const cursorFilter =
    decodedCursor?.mode === "recommend"
      ? Prisma.sql`AND (s."recommendScore", s.id) < (${decodedCursor.score}::double precision, ${decodedCursor.id})`
      : Prisma.empty;

  const excludeUserFilter = options.userId
    ? Prisma.sql`AND p."userId" != ${options.userId}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<RecommendFeedRow[]>(
    Prisma.sql`
      WITH scored AS (
        SELECT
          p.id,
          p.title,
          p.content,
          p.status,
          p."publishedAt",
          p."updatedAt",
          p."viewCount",
          p."likeCount",
          p.tags,
          u.name AS user_name,
          u.email AS user_email,
          u.phone AS user_phone,
          ${Prisma.raw(scoreExpr)} AS "recommendScore"
        FROM "Post" p
        INNER JOIN "User" u ON u.id = p."userId"
        WHERE p.status = ${PostStatus.PUBLISHED}::"PostStatus"
        ${excludeUserFilter}
        ${buildTopicTagSql(options.topic)}
      )
      SELECT
        s.id,
        s.title,
        s.content,
        s.status,
        s."publishedAt",
        s."updatedAt",
        s."viewCount",
        s."likeCount",
        s.tags,
        s.user_name,
        s.user_email,
        s.user_phone,
        s."recommendScore"
      FROM scored s
      WHERE 1 = 1
      ${cursorFilter}
      ORDER BY s."recommendScore" DESC, s.id DESC
      LIMIT ${limit + 1}
    `
  );

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const pagePosts = pageRows.map(mapRecommendRow);

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
      ? encodeHomeCursor(
          buildHomeCursorFromPost(lastPost, "recommend", { scoreAsOf })
        )
      : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

/** 当前请求是否应走推荐综合分查询。 */
export function isHomeRecommendFeed(
  channel: FeedChannelParam,
  sort: FeedSort
) {
  return channel === null && sort === "recommend";
}
