"use client";

import {
  HotRankBadge,
  RisingFastBadge,
  SustainedHotBadge,
  ViralQualityBlock,
} from "./badges";
import { ArticleListItem } from "./list-item";
import type {
  ArticleRowProps,
  HomeListItemProps,
  HotListItemProps,
  ViralListItemProps,
} from "./types";
import type { FeedArticleItem } from "@/lib/posts/list-types";

/** 首页默认列表行：带头像作者行 + ArticleMetaBadges + 可交互指标。 */
export function HomeListItem(props: HomeListItemProps) {
  return (
    <ArticleListItem
      {...props}
      metaDisplay="combined"
      showAuthorAvatar
      showMetrics={props.showMetrics ?? true}
    />
  );
}

/** @deprecated 使用 HomeListItem */
export const HomeFeedListItem = HomeListItem;

/** 热点榜列表行：排名方块 + 快速上升角标。 */
export function HotListItem({
  rank,
  isRisingFast = false,
  ...props
}: HotListItemProps) {
  return (
    <ArticleListItem
      {...props}
      coverPriority={rank <= 3}
      leading={<HotRankBadge rank={rank} />}
      metaDisplay="tags-only"
      showAuthorAvatar={false}
      topRightBadge={isRisingFast ? <RisingFastBadge /> : undefined}
    />
  );
}

/** @deprecated 使用 HotListItem */
export const HotFeedListItem = HotListItem;

/** 爆文榜列表行：质量分色块 + 持续热门角标。 */
export function ViralListItem({
  score,
  sustainedHotDays,
  ...props
}: ViralListItemProps) {
  return (
    <ArticleListItem
      {...props}
      leading={<ViralQualityBlock score={score} />}
      metaDisplay="tags-only"
      showAuthorAvatar={false}
      topRightBadge={
        sustainedHotDays != null && sustainedHotDays >= 2 ? (
          <SustainedHotBadge days={sustainedHotDays} />
        ) : undefined
      }
    />
  );
}

/** @deprecated 使用 ViralListItem */
export const ViralFeedListItem = ViralListItem;

/** FeedArticleItem → 列表行 props 边界；已发布/草稿列表共用。 */
export function ArticleRow(props: ArticleRowProps) {
  return <HomeListItem {...props} />;
}

/** @deprecated 使用 ArticleRow */
export const FeedArticleRow = ArticleRow;

type ArticleListProps = {
  items: FeedArticleItem[];
  /** 传入时在点击卡片进入详情前写入 sessionStorage，配合 ListScrollRestore 使用。 */
  scrollStorageKey?: string;
};

export function ArticleList({ items, scrollStorageKey }: ArticleListProps) {
  return (
    <div className="px-5 py-2">
      {items.map(({ id, persistMetrics, likedByViewer, canLike, ...item }) => (
        <ArticleRow
          key={id}
          {...item}
          canLike={canLike}
          initialLiked={likedByViewer}
          postId={persistMetrics ? id : undefined}
          scrollStorageKey={scrollStorageKey}
        />
      ))}
    </div>
  );
}

/** @deprecated 使用 ArticleList */
export const FeedArticleList = ArticleList;
