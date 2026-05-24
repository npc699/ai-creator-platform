import { DEFAULT_FEED_SCORE } from "@/lib/feed/format-score";
import { PostStatus } from "@/lib/generated/prisma/client";
import { buildPostExcerpt } from "@/lib/posts/excerpt";
import type { FeedArticleItem } from "@/lib/feed/types";

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

type PublishedPostRecord = {
  id: string;
  title: string;
  content: string;
  status: PostStatus;
  publishedAt: Date | null;
  updatedAt: Date;
  viewCount: number;
  likeCount: number;
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

/** 将已发布 Post 转为 Feed 卡片数据结构。 */
export function mapPublishedPostToFeedItem(
  post: PublishedPostRecord,
  authorLabel: string
): FeedArticleItem {
  return {
    id: post.id,
    author: authorLabel,
    time: formatPublishedTime(post.publishedAt ?? post.updatedAt),
    title: post.title,
    excerpt: buildPostExcerpt(post.content),
    score: DEFAULT_FEED_SCORE,
    views: post.viewCount,
    likes: post.likeCount,
    href: `/posts/${post.id}`,
    singleLineExcerpt: true,
    publishStatus: mapPostStatusToPublishStatus(post.status),
    persistMetrics: true,
  };
}
