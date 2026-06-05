"use client";

import { useSearchParams } from "next/navigation";

import { PanelTabNav } from "@/components/content-panel";
import {
  buildFeedSortOptions,
  parseFeedChannel,
  parseFeedSort,
} from "@/lib/feed/panel-params";

/** 首页 Feed 顶部排序 Tab。 */
export function FeedSortNav() {
  const searchParams = useSearchParams();
  const sort = parseFeedSort(searchParams.get("sort"));
  const channel = parseFeedChannel(searchParams.get("channel"));

  return (
    <PanelTabNav
      activeKey={sort}
      ariaLabel="内容筛选"
      options={buildFeedSortOptions(channel)}
    />
  );
}
