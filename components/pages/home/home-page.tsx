import { EditorLinkEmptyState } from "@/components/article";
import { FeedPanel, HomeFeedInfiniteList } from "@/components/feed";
import type { FeedChannelParam, FeedSort } from "@/lib/feed/params";
import type { HomeFeedListItem } from "@/lib/feed/home/query";
import { getHomeEmptyMessage } from "@/lib/feed/home/list";

type HomePageProps = {
  channel: FeedChannelParam;
  sort: FeedSort;
  topic: string | null;
  homeReturnPath: string;
  scrollStorageKey: string;
  items: HomeFeedListItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

/** 首页 Feed 主体：FeedPanel + 空态或无限滚动列表。 */
export function HomePage({
  channel,
  sort,
  topic,
  homeReturnPath,
  scrollStorageKey,
  items,
  hasMore,
  nextCursor,
}: HomePageProps) {
  return (
    <FeedPanel channel={channel}>
      {items.length === 0 ? (
        <EditorLinkEmptyState
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
  );
}
