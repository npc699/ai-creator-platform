"use client";

import { useSearchParams } from "next/navigation";

import { PanelTabNav } from "@/components/content-panel";
import {
  buildPublishedQuery,
  parsePublishedFilter,
  PUBLISHED_FILTER_OPTIONS,
} from "@/lib/feed/panel-params";

export function PublishedSortNav() {
  const searchParams = useSearchParams();
  const filter = parsePublishedFilter(searchParams.get("filter"));

  return (
    <PanelTabNav
      activeKey={filter}
      ariaLabel="已发布筛选"
      options={PUBLISHED_FILTER_OPTIONS.map(({ filter: filterKey, label }) => ({
        key: filterKey,
        label,
        href: buildPublishedQuery({ filter: filterKey }),
      }))}
    />
  );
}
