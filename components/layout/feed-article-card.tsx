"use client";

import { HomeFeedListItem } from "@/components/layout/home-feed-list-item";
import type { FeedArticleItem } from "@/lib/feed/types";

export type FeedArticleCardProps = Omit<
  FeedArticleItem,
  "id" | "persistMetrics" | "likedByViewer" | "canLike"
> & {
  postId?: string;
  canLike?: boolean;
  initialLiked?: boolean;
  isDeleting?: boolean;
  onDelete?: () => void;
  showMetrics?: boolean;
  /** 跳转详情前写入 sessionStorage，配合 FeedScrollRestore 恢复列表滚动位置。 */
  scrollStorageKey?: string;
  /** 首页分页列表：已加载条数，用于返回时预拉取到同等深度。 */
  scrollLoadedCount?: number;
  coverUrl?: string | null;
  profileReturnPath?: string | null;
};

/** 已发布/草稿列表适配器，内部统一为 FeedListItem 单元格行。 */
export function FeedArticleCard(props: FeedArticleCardProps) {
  return <HomeFeedListItem {...props} />;
}
