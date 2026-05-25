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
    score: getPostDisplayScore(post.qualityScore),
    tags: post.tags,
    views: post.viewCount,
    likes: post.likeCount,
    href: `/posts/${post.id}`,
    singleLineExcerpt: true,
    publishStatus: mapPostStatusToPublishStatus(post.status),
    reviewPending: post.reviewStatus === "PENDING",
    persistMetrics: true,
  };
}

type HomePostRecord = Omit<PublishedPostRecord, "prompt"> & {
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
};

/** 首页 Feed：全站已发布文章，不展示作者私有的上线状态角标。 */
export function mapPostToHomeFeedItem(post: HomePostRecord): FeedArticleItem {
  const item = mapPublishedPostToFeedItem(
    { ...post, prompt: null },
    getAuthorLabel(post.user)
  );
  return {
    ...item,
    publishStatus: undefined,
    persistMetrics: true,
  };
}
