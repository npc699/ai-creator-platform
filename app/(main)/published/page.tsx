// 已发布列表：filter 由 URL 驱动，支持排序切换与滚动位置恢复。
import { ContentPanel } from "@/components/content-panel";
import { FeedArticleList } from "@/components/feed";
import { FeedScrollRestore } from "@/components/feed";
import { FeedEmptyState } from "@/components/feed";
import { PublishedSortNav } from "@/components/feed";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildPublishedQuery,
  parsePublishedFilter,
} from "@/lib/feed/panel-params";
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

/** 路由 `/published`；filter 写入 URL，publishedReturnPath 用于回跳与 scroll storage key。 */
export default async function PublishedPage({
  searchParams,
}: PublishedPageProps) {
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

  const authorLabel = user ? getAuthorLabel(user) : "我";
  // 批量查点赞态，避免列表逐条请求。
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
    // 与首页 Feed 一致：仅登录用户展示可点赞交互。
    canLike: Boolean(user),
  }));
  return (
    <>
      <FeedScrollRestore storageKey={scrollStorageKey} />
      <ContentPanel header={<PublishedSortNav />} suspenseHeader>
        {feedItems.length === 0 ? (
          <FeedEmptyState
            actionHref="/editor"
            actionLabel="去编辑器创作"
            message={getPublishedEmptyMessage(filter)}
          />
        ) : (
          <FeedArticleList
            items={feedItems}
            scrollStorageKey={scrollStorageKey}
          />
        )}
      </ContentPanel>
    </>
  );
}
