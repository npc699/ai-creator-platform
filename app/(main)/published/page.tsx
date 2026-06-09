// ??????filter ? URL ?????????????????
import { PublishedFilterNav } from "@/components/article";
import { PublishedPage } from "@/components/pages";
import { ContentPanel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildPublishedQuery,
  parsePublishedFilter,
} from "@/lib/posts/panel-params";
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
} from "@/lib/posts/published-list";

type PublishedRouteProps = {
  searchParams: Promise<{ filter?: string }>;
};

/** ?? `/published`?filter ?? URL?publishedReturnPath ????? scroll storage key? */
export default async function PublishedRoute({
  searchParams,
}: PublishedRouteProps) {
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
          coverUrl: true,
          qualityScore: true,
          reviewStatus: true,
          prompt: {
            select: { title: true },
          },
        },
      })
    : [];

  const authorLabel = user ? getAuthorLabel(user) : "?";
  const likedPostIds = user
    ? await getLikedPostIds(
        user.id,
        posts.map((post) => post.id)
      )
    : new Set<string>();
  const feedItems = posts.map((post) => ({
    ...mapPublishedPostToFeedItem(post, authorLabel, {
      id: user!.id,
      image: user!.image,
    }),
    href: buildPostHref(post.id, publishedReturnPath),
    likedByViewer: likedPostIds.has(post.id),
    canLike: Boolean(user),
  }));

  return (
    <ContentPanel header={<PublishedFilterNav />} suspenseHeader>
      <PublishedPage
        feedItems={feedItems}
        filter={filter}
        scrollStorageKey={scrollStorageKey}
      />
    </ContentPanel>
  );
}
