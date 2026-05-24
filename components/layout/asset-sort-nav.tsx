"use client";

import { useSearchParams } from "next/navigation";

import { PanelTabNav } from "@/components/layout/panel-tab-nav";
import {
  ASSET_FILTER_OPTIONS,
  buildAssetsQuery,
  parseAssetFilter,
} from "@/lib/feed/panel-params";

export function AssetSortNav() {
  const searchParams = useSearchParams();
  const filter = parseAssetFilter(searchParams.get("filter"));

  return (
    <PanelTabNav
      activeKey={filter}
      ariaLabel="素材筛选"
      options={ASSET_FILTER_OPTIONS.map(({ filter: filterKey, label }) => ({
        key: filterKey,
        label,
        href: buildAssetsQuery({ filter: filterKey }),
      }))}
    />
  );
}
