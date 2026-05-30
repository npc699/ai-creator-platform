"use client";

import {
  FeedListItem,
  HotRankBadge,
  RisingFastBadge,
  type FeedListItemProps,
} from "@/components/layout/feed-list-item";

export type HotFeedListItemProps = Omit<
  FeedListItemProps,
  "leading" | "topRightBadge" | "coverPriority" | "showAuthorAvatar" | "metaDisplay"
> & {
  rank: number;
  isRisingFast?: boolean;
};

/** 热点榜列表行：排名方块 + 快速上升角标。 */
export function HotFeedListItem({
  rank,
  isRisingFast = false,
  ...props
}: HotFeedListItemProps) {
  return (
    <FeedListItem
      {...props}
      coverPriority={rank <= 3}
      leading={<HotRankBadge rank={rank} />}
      metaDisplay="tags-only"
      showAuthorAvatar={false}
      topRightBadge={isRisingFast ? <RisingFastBadge /> : undefined}
    />
  );
}
