import { AssetsPageContent } from "@/components/layout/assets-page-content";
import { ContentPanel } from "@/components/layout/content-panel";
import { FeedPageLayout } from "@/components/layout/feed-page-layout";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AssetsPage() {
  const user = await getCurrentUser();

  const assets = user
    ? await prisma.asset.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          url: true,
          mimeType: true,
          source: true,
          createdAt: true,
        },
      })
    : [];

  const items = assets.map((asset) => ({
    ...asset,
    createdAt: asset.createdAt.toISOString(),
  }));

  return (
    <FeedPageLayout>
      <ContentPanel>
        <AssetsPageContent initialItems={items} />
      </ContentPanel>
    </FeedPageLayout>
  );
}
