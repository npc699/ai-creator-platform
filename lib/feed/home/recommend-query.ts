import { Prisma } from "@/lib/generated/prisma/client";
import { PostStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { FeedChannelParam, FeedSort } from "@/lib/feed/params";
import { mapPostToHomeFeedItem } from "@/lib/feed/home/map-item";
import {
  buildHomeCursorFromPost,
  decodeHomeCursor,
  encodeHomeCursor,
} from "@/lib/feed/home/cursor";
import type { FetchHomeFeedPageOptions, HomeFeedListItem } from "@/lib/feed/home/query";
import { resolveTopicTagFilter } from "@/lib/feed/topic-params";
import {
  recommendScoreSql,
  RECOMMEND_FORMULA_VERSION,
} from "@/lib/feed/scores/recommend";
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
  coverUrl: string | null;
  qualityScore: number | null;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  user_id: string;
  user_image: string | null;
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
    coverUrl: row.coverUrl,
    qualityScore: row.qualityScore,
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      phone: row.user_phone,
      image: row.user_image,
    },
  };
}

function buildTopicTagSql(topic: string | null) {
  const tags = resolveTopicTagFilter(topic);
  if (!tags?.length) {
    return Prisma.empty;
  }
  return Prisma.sql`AND p.tags && ${tags}::text[]`;
}

/** 推荐 Tab：按综合分（互动 + 质量 + 时间衰减）排序并分页�?*/
export async function fetchHomeFeedRecommendPage(
  options: FetchHomeFeedPageOptions,
  limit: number
) {
  const decodedCursor = decodeHomeCursor(options.cursor);
  const recommendCursor =
    decodedCursor?.mode === "recommend" &&
    decodedCursor.formulaVersion === RECOMMEND_FORMULA_VERSION
      ? decodedCursor
      : null;
  const scoreAsOf = recommendCursor
    ? new Date(recommendCursor.asOf)
    : new Date();
  const scoreExpr = recommendScoreSql("p", scoreAsOf);

  const cursorFilter =
    recommendCursor
      ? Prisma.sql`AND (s."recommendScore", s.id) < (${recommendCursor.score}::double precision, ${recommendCursor.id})`
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
          p."coverUrl",
          p."qualityScore",
          p.tags,
          u.name AS user_name,
          u.email AS user_email,
          u.phone AS user_phone,
          u.id AS user_id,
          u.image AS user_image,
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
        s."coverUrl",
        s."qualityScore",
        s.tags,
        s.user_name,
        s.user_email,
        s.user_phone,
        s.user_id,
        s.user_image,
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

  const postIds = pagePosts.map((post) => post.id);
  const likedPostIds = options.userId
    ? await getLikedPostIds(options.userId, postIds)
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

/** 当前请求是否应走推荐综合分查询�?*/
export function isHomeRecommendFeed(
  channel: FeedChannelParam,
  sort: FeedSort
) {
  return channel === null && sort === "recommend";
}
