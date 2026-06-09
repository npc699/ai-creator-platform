import { PostStatus } from "@/lib/generated/prisma/client";

import { buildFeedListExcerpt } from "./excerpt";
import type { FeedArticleItem } from "./list-types";

export function getAuthorLabel(user: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  return user.name ?? user.email ?? user.phone ?? "我";
}

export function formatPublishedTime(date: Date) {
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 详情页日期展示，与参考布局一致（不含时分）。 */
export function formatPostArticleDate(date: Date) {
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getPostDisplayScore(score?: number | null): number | null {
  return score != null ? Math.round(score) : null;
}

type PublishedPostRecord = {
  id: string;
  title: string;
  content: string;
  status: PostStatus;
  publishedAt: Date | null;
  updatedAt: Date;
  viewCount: number;
  likeCount: number;
  tags: string[];
  coverUrl?: string | null;
  qualityScore?: number | null;
  reviewStatus?: string | null;
  prompt: { title: string } | null;
};

function mapPostStatusToPublishStatus(
  status: PostStatus
): FeedArticleItem["publishStatus"] {
  if (status === PostStatus.PUBLISHED) {
    return "online";
  }
  if (status === PostStatus.ARCHIVED) {
    return "offline";
  }
  return undefined;
}

type AuthorFeedMeta = {
  id: string;
  image?: string | null;
};

/** 将已发布 Post 转为 Feed 卡片数据结构。 */
export function mapPublishedPostToFeedItem(
  post: PublishedPostRecord,
  authorLabel: string,
  authorMeta?: AuthorFeedMeta
): FeedArticleItem {
  const coverUrl = post.coverUrl ?? null;
  return {
    id: post.id,
    author: authorLabel,
    authorId: authorMeta?.id ?? "",
    authorImage: authorMeta?.image ?? null,
    time: formatPublishedTime(post.publishedAt ?? post.updatedAt),
    title: post.title,
    excerpt: buildFeedListExcerpt(post.content, Boolean(coverUrl)),
    score: getPostDisplayScore(post.qualityScore),
    tags: post.tags,
    views: post.viewCount,
    likes: post.likeCount,
    href: `/posts/${post.id}`,
    publishStatus: mapPostStatusToPublishStatus(post.status),
    reviewPending: post.reviewStatus === "PENDING",
    persistMetrics: true,
    coverUrl,
  };
}
