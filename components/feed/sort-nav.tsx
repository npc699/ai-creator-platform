"use client";

import { useSearchParams } from "next/navigation";

import { PanelTabNav } from "@/components/ui";
import { buildFeedSortOptions, parseFeedChannel, parseFeedSort } from "@/lib/feed/params";

/** ?? Feed ???? Tab? */
export function FeedSortNav() {
  const searchParams = useSearchParams();
  const sort = parseFeedSort(searchParams.get("sort"));
  const channel = parseFeedChannel(searchParams.get("channel"));

  return (
    <PanelTabNav
      activeKey={sort}
      ariaLabel="????"
      options={buildFeedSortOptions(channel)}
    />
  );
}
