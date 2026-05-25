import { HomeFeedInfiniteList } from "@/components/layout/home-feed-infinite-list";
import { FeedEmptyState } from "@/components/layout/feed-empty-state";
import { FeedPageLayout } from "@/components/layout/feed-page-layout";
import { FeedPanel } from "@/components/layout/feed-panel";
import { getCurrentUser } from "@/lib/auth";
import { buildHomeQuery, parseFeedChannel, parseFeedSort } from "@/lib/feed/params";
import { fetchHomeFeedPage } from "@/lib/posts/home-feed-query";
import { getHomeEmptyMessage } from "@/lib/posts/home-list";
import { getFeedScrollStorageKey } from "@/lib/posts/reader-navigation";

type HomePageProps = {
  searchParams: Promise<{
    channel?: string;
    sort?: string;
    topic?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const channel = parseFeedChannel(params.channel ?? null);
  const sort = parseFeedSort(params.sort ?? null);
  const topic = params.topic?.trim() || null;
  const homeReturnPath = buildHomeQuery({
    channel,
    sort,
    topic: topic ?? undefined,
  });
  const scrollStorageKey = getFeedScrollStorageKey(homeReturnPath);

  const user = await getCurrentUser();

  const { items, nextCursor, hasMore } = await fetchHomeFeedPage({
    channel,
    sort,
    topic,
    userId: user?.id,
    homeReturnPath,
  });

  return (
    <FeedPageLayout>
      <FeedPanel>
        {items.length === 0 ? (
          <FeedEmptyState
            actionHref="/editor"
            actionLabel="去编辑器创作"
            message={getHomeEmptyMessage({ channel, topic })}
          />
        ) : (
          <HomeFeedInfiniteList
            key={homeReturnPath}
            channel={channel}
            homeReturnPath={homeReturnPath}
            initialHasMore={hasMore}
            initialItems={items}
            initialNextCursor={nextCursor}
            scrollStorageKey={scrollStorageKey}
            sort={sort}
            topic={topic}
          />
        )}
      </FeedPanel>
    </FeedPageLayout>
  );
}
