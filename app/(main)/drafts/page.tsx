import { ContentPanel } from "@/components/layout/content-panel";
import { DraftArticleList } from "@/components/layout/draft-article-list";
import { FeedEmptyState } from "@/components/layout/feed-empty-state";
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
          updatedAt: true,
          prompt: {
            select: { title: true },
          },
        },
      })
    : [];

  const authorLabel = user ? getAuthorLabel(user) : "我";
  const feedItems = drafts.map((draft) => mapDraftToFeedItem(draft, authorLabel));

  return (
    <FeedPageLayout>
      <ContentPanel>
        {feedItems.length === 0 ? (
          <FeedEmptyState
            actionHref="/editor"
            actionLabel="去编辑器创作"
            message="还没有草稿，去编辑器开始创作吧"
          />
        ) : (
          <DraftArticleList items={feedItems} userId={user?.id} />
        )}
      </ContentPanel>
    </FeedPageLayout>
  );
}
