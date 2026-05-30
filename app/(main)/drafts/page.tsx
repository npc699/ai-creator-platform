import { ContentPanel } from "@/components/layout/content-panel";
import { DraftsPageContent } from "@/components/layout/drafts-page-content";
import { FeedPageLayout } from "@/components/layout/feed-page-layout";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildDraftListWhere } from "@/lib/drafts/query";
import { mapDraftToFeedItem } from "@/lib/drafts/feed-item";
import { getAuthorLabel } from "@/lib/posts/feed-item";

export default async function DraftsPage() {
  const user = await getCurrentUser();

  const drafts = user
    ? await prisma.draft.findMany({
        where: buildDraftListWhere(user.id),
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          coverUrl: true,
          updatedAt: true,
          prompt: {
            select: { title: true },
          },
        },
      })
    : [];

  const authorLabel = user ? getAuthorLabel(user) : "我";
  const feedItems = drafts.map((draft) =>
    mapDraftToFeedItem(draft, authorLabel, user?.id ?? "")
  );

  return (
    <FeedPageLayout>
      <ContentPanel>
        <DraftsPageContent items={feedItems} userId={user?.id} />
      </ContentPanel>
    </FeedPageLayout>
  );
}
