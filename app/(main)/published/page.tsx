import { ContentPanel } from "@/components/layout/content-panel";
import { FeedArticleList } from "@/components/layout/feed-article-list";
import { FeedEmptyState } from "@/components/layout/feed-empty-state";
import { FeedPageLayout } from "@/components/layout/feed-page-layout";
import { PublishedSortNav } from "@/components/layout/published-sort-nav";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parsePublishedFilter } from "@/lib/feed/panel-params";
import { getLikedPostIds } from "@/lib/posts/metrics";
import {
  getAuthorLabel,
  mapPublishedPostToFeedItem,
} from "@/lib/posts/feed-item";
import {
  buildPublishedListOrderBy,
  buildPublishedListWhere,
  getPublishedEmptyMessage,
} from "@/lib/posts/published-list";

type PublishedPageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function PublishedPage({ searchParams }: PublishedPageProps) {
  const user = await getCurrentUser();
  const { filter: filterParam } = await searchParams;
  const filter = parsePublishedFilter(filterParam ?? null);

  const posts = user
    ? await prisma.post.findMany({
        where: buildPublishedListWhere(user.id, filter),
        orderBy: buildPublishedListOrderBy(filter),
        select: {
          id: true,
          title: true,
          content: true,
          status: true,
          publishedAt: true,
          updatedAt: true,
          viewCount: true,
          likeCount: true,
          prompt: {
            select: { title: true },
          },
        },
      })
    : [];

  const authorLabel = user ? getAuthorLabel(user) : "我";
  const likedPostIds = user
    ? await getLikedPostIds(
        user.id,
        posts.map((post) => post.id)
      )
    : new Set<string>();
  const feedItems = posts.map((post) => ({
    ...mapPublishedPostToFeedItem(post, authorLabel),
    likedByViewer: likedPostIds.has(post.id),
    canLike: Boolean(user),
  }));

  return (
    <FeedPageLayout>
      <ContentPanel header={<PublishedSortNav />} suspenseHeader>
        {feedItems.length === 0 ? (
          <FeedEmptyState
            actionHref="/editor"
            actionLabel="去编辑器创作"
            message={getPublishedEmptyMessage(filter)}
          />
        ) : (
          <FeedArticleList items={feedItems} />
        )}
      </ContentPanel>
    </FeedPageLayout>
  );
}
