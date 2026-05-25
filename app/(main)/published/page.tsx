import { ContentPanel } from "@/components/layout/content-panel";
import { FeedArticleList } from "@/components/layout/feed-article-list";
import { FeedScrollRestore } from "@/components/layout/feed-scroll-restore";
import { FeedEmptyState } from "@/components/layout/feed-empty-state";
import { FeedPageLayout } from "@/components/layout/feed-page-layout";
import { PublishedSortNav } from "@/components/layout/published-sort-nav";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildPublishedQuery, parsePublishedFilter } from "@/lib/feed/panel-params";
import { getLikedPostIds } from "@/lib/posts/metrics";
import {
  buildPostHref,
  getFeedScrollStorageKey,
} from "@/lib/posts/reader-navigation";
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
  const publishedReturnPath = buildPublishedQuery({ filter });
  const scrollStorageKey = getFeedScrollStorageKey(publishedReturnPath);

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
          tags: true,
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
    href: buildPostHref(post.id, publishedReturnPath),
    likedByViewer: likedPostIds.has(post.id),
    canLike: Boolean(user),
  }));

  return (
    <FeedPageLayout>
      <FeedScrollRestore storageKey={scrollStorageKey} />
      <ContentPanel header={<PublishedSortNav />} suspenseHeader>
        {feedItems.length === 0 ? (
          <FeedEmptyState
            actionHref="/editor"
            actionLabel="去编辑器创作"
            message={getPublishedEmptyMessage(filter)}
          />
        ) : (
          <FeedArticleList items={feedItems} scrollStorageKey={scrollStorageKey} />
        )}
      </ContentPanel>
    </FeedPageLayout>
  );
}
