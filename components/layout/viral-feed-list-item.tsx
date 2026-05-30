"use client";

import {
  FeedListItem,
  SustainedHotBadge,
  ViralQualityBlock,
  type FeedListItemProps,
} from "@/components/layout/feed-list-item";

export type ViralFeedListItemProps = Omit<
  FeedListItemProps,
  "leading" | "topRightBadge" | "showAuthorAvatar" | "metaDisplay"
> & {
  score: number | null;
  sustainedHotDays?: number | null;
};

/** 爆文榜列表行：质量分色块 + 持续热门角标。 */
export function ViralFeedListItem({
  score,
  sustainedHotDays,
  ...props
}: ViralFeedListItemProps) {
  return (
    <FeedListItem
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
