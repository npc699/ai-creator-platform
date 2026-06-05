// 首页 Feed：channel / sort / topic 由 URL 驱动，首屏 SSR + 客户端无限滚动加载更多。
import { HomeFeedInfiniteList } from "@/components/feed";
import { FeedEmptyState } from "@/components/feed";
import { FeedPanel } from "@/components/content-panel";
import { getCurrentUser } from "@/lib/auth";
import {
  buildHomeQuery,
  parseFeedChannel,
  parseFeedSort,
} from "@/lib/feed/params";
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

/** 路由 `/`；筛选变化时重建列表并恢复对应滚动位置。 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const channel = parseFeedChannel(params.channel ?? null);
  const sort = parseFeedSort(params.sort ?? null);
  const topic = params.topic?.trim() || null;
  // canonical 查询串：文章页回跳、滚动 storage key 与无限列表 key 共用，须保持一致。
  const homeReturnPath = buildHomeQuery({
    channel,
    sort,
    topic: topic ?? undefined,
  });
  const scrollStorageKey = getFeedScrollStorageKey(homeReturnPath);

  const user = await getCurrentUser();

  // userId 用于点赞态等个性化字段；layout 已保证登录，此处 optional 仅为类型防御。
  const { items, nextCursor, hasMore } = await fetchHomeFeedPage({
    channel,
    sort,
    topic,
    userId: user?.id,
    homeReturnPath,
  });

  return (
    <FeedPanel channel={channel}>
      {items.length === 0 ? (
        <FeedEmptyState
          actionHref="/editor"
          actionLabel="去编辑器创作"
          message={getHomeEmptyMessage({ channel, topic })}
        />
      ) : (
        <HomeFeedInfiniteList
          // 筛选组合变化时 remount，避免旧列表 state 与新 channel/sort 混用。
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
  );
}
