import type { ReactNode } from "react";

export type ArticleListItemProps = {
  postId?: string;
  author?: string;
  authorId?: string;
  authorImage?: string | null;
  profileReturnPath?: string | null;
  time?: string;
  title: string;
  excerpt: string;
  tags?: string[];
  score?: number | null;
  reviewPending?: boolean;
  views: number;
  likes: number;
  href?: string;
  coverUrl?: string | null;
  canLike?: boolean;
  initialLiked?: boolean;
  scrollStorageKey?: string;
  scrollLoadedCount?: number;
  /** 左侧锚点：排名、质量分等 */
  leading?: ReactNode;
  topRightBadge?: ReactNode;
  coverPriority?: boolean;
  /** 作者行是否展示头像；false 时为榜单式「名 · 时间」 */
  showAuthorAvatar?: boolean;
  /** 隐藏作者行（发布者主页等） */
  hideAuthorRow?: boolean;
  /** 无作者行时在指标区展示日期 */
  dateLabel?: string;
  showMetrics?: boolean;
  /** 仅展示静态点赞数，不可交互 */
  readOnlyMetrics?: boolean;
  /** combined：质量分/审核/标签；tags-only：灰色标签 pill（榜单） */
  metaDisplay?: "combined" | "tags-only";
  onDelete?: () => void;
  isDeleting?: boolean;
  publishStatus?: "online" | "offline";
};

/** @deprecated 使用 ArticleListItemProps */
export type FeedListItemProps = ArticleListItemProps;

export type ListScrollPayload = {
  scrollY: number;
  loadedCount?: number;
};

/** @deprecated 使用 ListScrollPayload */
export type FeedScrollPayload = ListScrollPayload;

export type HomeListItemProps = Omit<
  ArticleListItemProps,
  | "showAuthorAvatar"
  | "metaDisplay"
  | "hideAuthorRow"
  | "readOnlyMetrics"
  | "leading"
>;

/** @deprecated 使用 HomeListItemProps */
export type HomeFeedListItemProps = HomeListItemProps;

export type HotListItemProps = Omit<
  ArticleListItemProps,
  | "leading"
  | "topRightBadge"
  | "coverPriority"
  | "showAuthorAvatar"
  | "metaDisplay"
> & {
  rank: number;
  isRisingFast?: boolean;
};

/** @deprecated 使用 HotListItemProps */
export type HotFeedListItemProps = HotListItemProps;

export type ViralListItemProps = Omit<
  ArticleListItemProps,
  "leading" | "topRightBadge" | "showAuthorAvatar" | "metaDisplay"
> & {
  score: number | null;
  sustainedHotDays?: number | null;
};

/** @deprecated 使用 ViralListItemProps */
export type ViralFeedListItemProps = ViralListItemProps;

export type ArticleRowProps = HomeListItemProps;

/** @deprecated 使用 ArticleRowProps */
export type FeedArticleRowProps = ArticleRowProps;
