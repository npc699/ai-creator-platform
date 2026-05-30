"use client";

import {
  FeedListItem,
  type FeedListItemProps,
} from "@/components/layout/feed-list-item";

export type HomeFeedListItemProps = Omit<
  FeedListItemProps,
  "showAuthorAvatar" | "metaDisplay" | "hideAuthorRow" | "readOnlyMetrics" | "leading"
>;

/** 首页默认 Feed 列表行：带头像作者行 + ArticleMetaBadges + 可交互指标。 */
export function HomeFeedListItem(props: HomeFeedListItemProps) {
  return (
    <FeedListItem
      {...props}
      metaDisplay="combined"
      showAuthorAvatar
      showMetrics={props.showMetrics ?? true}
    />
  );
}
