"use client";

import { useSearchParams } from "next/navigation";

import { TabNav } from "@/components/ui";
import {
  buildPublishedQuery,
  parsePublishedFilter,
  PUBLISHED_FILTER_OPTIONS,
} from "@/lib/posts/panel-params";

/** ???????? Tab? */
export function PublishedFilterNav() {
  const searchParams = useSearchParams();
  const filter = parsePublishedFilter(searchParams.get("filter"));

  return (
    <TabNav
      activeKey={filter}
      ariaLabel="?????"
      options={PUBLISHED_FILTER_OPTIONS.map(({ filter: filterKey, label }) => ({
        key: filterKey,
        label,
        href: buildPublishedQuery({ filter: filterKey }),
      }))}
    />
  );
}

/** @deprecated ?? PublishedFilterNav */
export const PublishedSortNav = PublishedFilterNav;
