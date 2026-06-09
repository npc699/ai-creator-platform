// 首页 Feed：channel / sort / topic 由 URL 驱动，首屏 SSR + 客户端无限滚动加载更多。
import { HomePage } from "@/components/pages";
import { getCurrentUser } from "@/lib/auth";
import {
  buildHomeQuery,
  parseFeedChannel,
  parseFeedSort,
} from "@/lib/feed/params";
import { fetchHomeFeedPage } from "@/lib/feed/home/query";
import { getFeedScrollStorageKey } from "@/lib/posts/reader-navigation";

type HomeRouteProps = {
  searchParams: Promise<{
    channel?: string;
    sort?: string;
    topic?: string;
  }>;
};

/** 路由 `/`；筛选变化时重建列表并恢复对应滚动位置。 */
export default async function HomeRoute({ searchParams }: HomeRouteProps) {
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
    <HomePage
      channel={channel}
      hasMore={hasMore}
      homeReturnPath={homeReturnPath}
      items={items}
      nextCursor={nextCursor}
      scrollStorageKey={scrollStorageKey}
      sort={sort}
      topic={topic}
    />
  );
}
