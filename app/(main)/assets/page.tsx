import { AssetGrid } from "@/components/layout/asset-grid";
import { AssetSortNav } from "@/components/layout/asset-sort-nav";
import { ContentPanel } from "@/components/layout/content-panel";
import { FeedEmptyState } from "@/components/layout/feed-empty-state";
import { FeedPageLayout } from "@/components/layout/feed-page-layout";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parseAssetFilter,
  type AssetFilter,
} from "@/lib/feed/panel-params";
import type { Prisma } from "@/lib/generated/prisma/client";

type AssetsPageProps = {
  searchParams: Promise<{ filter?: string }>;
};

function buildAssetWhere(
  userId: string,
  filter: AssetFilter
): Prisma.AssetWhereInput {
  const base = { userId };

  if (filter === "image") {
    return { ...base, mimeType: { startsWith: "image/" } };
  }

  if (filter === "file") {
    return {
      ...base,
      OR: [{ mimeType: null }, { NOT: { mimeType: { startsWith: "image/" } } }],
    };
  }

  return base;
}

export default async function AssetsPage({ searchParams }: AssetsPageProps) {
  const user = await getCurrentUser();
  const { filter: filterParam } = await searchParams;
  const filter = parseAssetFilter(filterParam ?? null);

  const assets = user
    ? await prisma.asset.findMany({
        where: buildAssetWhere(user.id, filter),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          url: true,
          mimeType: true,
          createdAt: true,
        },
      })
    : [];

  return (
    <FeedPageLayout>
      <ContentPanel header={<AssetSortNav />} suspenseHeader>
        {assets.length === 0 ? (
          <FeedEmptyState
            actionHref="/editor"
            actionLabel="去编辑器上传素材"
            message="还没有素材，可在编辑器素材库中上传"
          />
        ) : (
          <AssetGrid items={assets} />
        )}
      </ContentPanel>
    </FeedPageLayout>
  );
}
