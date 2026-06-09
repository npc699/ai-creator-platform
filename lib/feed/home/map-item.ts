import {
  computeIsRisingFast,
  computeSustainedHotDays,
} from "@/lib/feed/badges";
import { formatRelativeTime } from "@/lib/feed/format";
import type { FeedChannelParam } from "@/lib/feed/params";
import { PostStatus } from "@/lib/generated/prisma/client";
import {
  getAuthorLabel,
  mapPublishedPostToFeedItem,
} from "@/lib/posts/feed-item";
import type { FeedArticleItem } from "@/lib/posts/list-types";

export type HomePostRecord = {
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
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    image?: string | null;
  };
};

type MapHomeFeedOptions = {
  showRank?: boolean;
  rank?: number;
  channel?: FeedChannelParam;
};

/** 首页 Feed：全站已发布文章，不展示作者私有的上线状态角标。 */
export function mapPostToHomeFeedItem(
  post: HomePostRecord,
  options?: MapHomeFeedOptions
): FeedArticleItem {
  const publishedAt = post.publishedAt ?? post.updatedAt;
  const rank = options?.showRank ? options.rank : undefined;

  const item = mapPublishedPostToFeedItem(
    { ...post, prompt: null },
    getAuthorLabel(post.user),
    { id: post.user.id, image: post.user.image ?? null }
  );

  if (options?.channel === "hot") {
    return {
      ...item,
      publishStatus: undefined,
      persistMetrics: true,
      rank,
      time: formatRelativeTime(publishedAt),
      isRisingFast: computeIsRisingFast(post, rank),
    };
  }

  if (options?.channel === "viral") {
    return {
      ...item,
      publishStatus: undefined,
      persistMetrics: true,
      time: formatRelativeTime(publishedAt),
      sustainedHotDays: computeSustainedHotDays(post),
    };
  }

  return {
    ...item,
    publishStatus: undefined,
    persistMetrics: true,
    rank,
  };
}
