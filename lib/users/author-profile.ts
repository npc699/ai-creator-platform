import { prisma } from "@/lib/db";
import { getAuthorLabel, getPostDisplayScore } from "@/lib/posts/feed-item";
import { buildFeedListExcerpt } from "@/lib/posts/excerpt";
import { CREATOR_PUBLISHED_POST_STATUSES } from "./creator-stats";
import { PostStatus } from "@/lib/generated/prisma/client";

export type PublicAuthorProfile = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
};

export type PublicAuthorStats = {
  postCount: number;
  totalViews: number;
  totalLikes: number;
};

export type PublicAuthorPost = {
  id: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  score: number | null;
  tags: string[];
  views: number;
  likes: number;
  publishedAt: Date | null;
  updatedAt: Date;
};

const publicAuthorPostSelect = {
  id: true,
  title: true,
  content: true,
  publishedAt: true,
  updatedAt: true,
  viewCount: true,
  likeCount: true,
  tags: true,
  coverUrl: true,
  qualityScore: true,
} as const;

/** 公开发布者资料，不存在时返回 null。 */
export async function getPublicAuthorProfile(
  userId: string
): Promise<PublicAuthorProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      bio: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: getAuthorLabel(user),
    image: user.image,
    bio: user.bio,
  };
}

/** 统计发布者已上线文章的篇数、总阅读与总点赞。 */
export async function getPublicAuthorStats(
  userId: string
): Promise<PublicAuthorStats> {
  const [postCount, aggregate] = await Promise.all([
    prisma.post.count({
      where: { userId, status: PostStatus.PUBLISHED },
    }),
    prisma.post.aggregate({
      where: { userId, status: PostStatus.PUBLISHED },
      _sum: { viewCount: true, likeCount: true },
    }),
  ]);

  return {
    postCount,
    totalViews: aggregate._sum.viewCount ?? 0,
    totalLikes: aggregate._sum.likeCount ?? 0,
  };
}

function mapAuthorPosts(
  posts: Array<{
    id: string;
    title: string;
    content: string;
    publishedAt: Date | null;
    updatedAt: Date;
    viewCount: number;
    likeCount: number;
    tags: string[];
    coverUrl: string | null;
    qualityScore: number | null;
  }>
): PublicAuthorPost[] {
  return posts.map((post) => {
    const coverUrl = post.coverUrl ?? null;
    return {
      id: post.id,
      title: post.title,
      excerpt: buildFeedListExcerpt(post.content, Boolean(coverUrl)),
      coverUrl,
      score: getPostDisplayScore(post.qualityScore),
      tags: post.tags,
      views: post.viewCount,
      likes: post.likeCount,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    };
  });
}

/** 发布者公开文章列表，仅含已上线内容。 */
export async function listPublicAuthorPosts(
  userId: string,
  limit = 50
): Promise<PublicAuthorPost[]> {
  const posts = await prisma.post.findMany({
    where: { userId, status: PostStatus.PUBLISHED },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: limit,
    select: publicAuthorPostSelect,
  });

  return mapAuthorPosts(posts);
}

/** 本人主页文章列表：与侧栏「已发布」口径一致（含已下线）。 */
export async function listCreatorAuthorPosts(
  userId: string,
  limit = 50
): Promise<PublicAuthorPost[]> {
  const posts = await prisma.post.findMany({
    where: {
      userId,
      status: { in: [...CREATOR_PUBLISHED_POST_STATUSES] },
    },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: limit,
    select: publicAuthorPostSelect,
  });

  return mapAuthorPosts(posts);
}
