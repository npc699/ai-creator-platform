"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  clearListScrollPayload,
  HomeListItem,
  HotListItem,
  ListItemSkeleton,
  readListScrollPayload,
  ViralListItem,
} from "@/components/article";
import type { FeedChannelParam, FeedSort } from "@/lib/feed/params";
import type {
  HomeFeedListItem as HomeFeedListItemData,
  HomeFeedPageResult,
} from "@/lib/feed/home/query";
import { mergeUniqueFeedItems } from "@/lib/posts/merge-feed-items";

const LIST_GAP_PX = 0;
const ESTIMATED_ROW_PX = 145;

type HomeFeedInfiniteListProps = {
  initialItems: HomeFeedListItemData[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  scrollStorageKey: string;
  homeReturnPath: string;
  channel: FeedChannelParam;
  sort: FeedSort;
  topic: string | null;
};

type HomeFeedFetchOptions = {
  channel: FeedChannelParam;
  sort: FeedSort;
  topic: string | null;
  homeReturnPath: string;
  cursor?: string | null;
};

// --- Client API ---

function buildHomeFeedApiUrl(options: HomeFeedFetchOptions) {
  const params = new URLSearchParams();
  if (options.channel) {
    params.set("channel", options.channel);
  }
  if (options.sort !== "recommend") {
    params.set("sort", options.sort);
  }
  if (options.topic) {
    params.set("topic", options.topic);
  }
  if (options.cursor) {
    params.set("cursor", options.cursor);
  }
  params.set("returnPath", options.homeReturnPath);
  return `/api/feed/home?${params.toString()}`;
}

async function fetchHomeFeedPageClient(
  options: HomeFeedFetchOptions
): Promise<HomeFeedPageResult> {
  const response = await fetch(buildHomeFeedApiUrl(options), {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("加载失败");
  }

  return response.json() as Promise<HomeFeedPageResult>;
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function getSkeletonVariant(channel: FeedChannelParam): "default" | "hot" | "viral" {
  if (channel === "hot") {
    return "hot";
  }
  if (channel === "viral") {
    return "viral";
  }
  return "default";
}

type FeedListItemRenderOptions = {
  channel: FeedChannelParam;
  item: HomeFeedListItemData;
  homeReturnPath: string;
  scrollStorageKey: string;
  scrollLoadedCount: number;
};

function renderFeedListItem({
  channel,
  item,
  homeReturnPath,
  scrollStorageKey,
  scrollLoadedCount,
}: FeedListItemRenderOptions) {
  const { id, likedByViewer, canLike, rank, isRisingFast, sustainedHotDays, ...cardProps } =
    item;

  const commonProps = {
    ...cardProps,
    canLike,
    initialLiked: likedByViewer,
    postId: id,
    profileReturnPath: homeReturnPath,
    scrollLoadedCount,
    scrollStorageKey,
  };

  if (channel === "hot" && rank != null) {
    return (
      <HotListItem
        {...commonProps}
        isRisingFast={isRisingFast}
        rank={rank}
      />
    );
  }

  if (channel === "viral") {
    return <ViralListItem {...commonProps} sustainedHotDays={sustainedHotDays} />;
  }

  return <HomeListItem {...commonProps} />;
}

/** 首页 Feed 无限滚动列表：虚拟滚动 + 分页加载 + 深滚恢复。 */
export function HomeFeedInfiniteList({
  initialItems,
  initialNextCursor,
  initialHasMore,
  scrollStorageKey,
  homeReturnPath,
  channel,
  sort,
  topic,
}: HomeFeedInfiniteListProps) {
  const skeletonVariant = getSkeletonVariant(channel);

  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(
    () => readListScrollPayload(scrollStorageKey) != null
  );
  const [trackedScrollKey, setTrackedScrollKey] = useState(scrollStorageKey);
  const [scrollMargin, setScrollMargin] = useState(0);

  // scrollStorageKey 变化时在 render 阶段同步恢复态，避免 effect 内 setState(true)。
  if (scrollStorageKey !== trackedScrollKey) {
    setTrackedScrollKey(scrollStorageKey);
    setIsRestoring(readListScrollPayload(scrollStorageKey) != null);
  }

  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchLockRef = useRef(false);
  const pendingScrollYRef = useRef<number | null>(null);
  const restoreGenerationRef = useRef(0);

  /** 首屏 SSR 快照，恢复滚动时用于预拉取，避免因 effect 依赖变化重复执行。 */
  const initialSnapshotRef = useRef({
    items: initialItems,
    nextCursor: initialNextCursor,
    hasMore: initialHasMore,
  });

  useEffect(() => {
    initialSnapshotRef.current = {
      items: initialItems,
      nextCursor: initialNextCursor,
      hasMore: initialHasMore,
    };
  }, [scrollStorageKey, initialItems, initialNextCursor, initialHasMore]);

  const useVirtualLayout = isRestoring;

  useLayoutEffect(() => {
    if (!useVirtualLayout) {
      return;
    }

    function updateScrollMargin() {
      setScrollMargin(listRef.current?.offsetTop ?? 0);
    }

    updateScrollMargin();
    window.addEventListener("resize", updateScrollMargin);
    return () => window.removeEventListener("resize", updateScrollMargin);
  }, [useVirtualLayout]);

  const virtualizer = useWindowVirtualizer({
    count: useVirtualLayout ? items.length : 0,
    estimateSize: () => ESTIMATED_ROW_PX + LIST_GAP_PX,
    overscan: 6,
    scrollMargin,
  });

  const fetchNextPage = useCallback(async () => {
    if (!hasMore || !nextCursor || fetchLockRef.current) {
      return;
    }

    fetchLockRef.current = true;
    setIsFetching(true);
    setFetchError(null);

    try {
      const result = await fetchHomeFeedPageClient({
        channel,
        sort,
        topic,
        homeReturnPath,
        cursor: nextCursor,
      });

      setItems((prev) => mergeUniqueFeedItems(prev, result.items));
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch {
      setFetchError("加载更多失败，请稍后重试");
    } finally {
      setIsFetching(false);
      fetchLockRef.current = false;
    }
  }, [hasMore, nextCursor, channel, sort, topic, homeReturnPath]);

  // --- Scroll restore ---

  useEffect(() => {
    const payload = readListScrollPayload(scrollStorageKey);
    if (!payload) {
      return;
    }

    const generation = ++restoreGenerationRef.current;
    let cancelled = false;

    const snapshot = initialSnapshotRef.current;
    const targetCount = payload.loadedCount ?? snapshot.items.length;
    const scrollY = payload.scrollY;

    async function restoreScroll() {
      let mergedItems = [...snapshot.items];
      let cursor = snapshot.nextCursor;
      let more = snapshot.hasMore;

      try {
        while (mergedItems.length < targetCount && more && cursor) {
          const page = await fetchHomeFeedPageClient({
            channel,
            sort,
            topic,
            homeReturnPath,
            cursor,
          });
          if (cancelled || generation !== restoreGenerationRef.current) {
            return;
          }
          mergedItems = mergeUniqueFeedItems(mergedItems, page.items);
          cursor = page.nextCursor;
          more = page.hasMore;
        }

        if (cancelled || generation !== restoreGenerationRef.current) {
          return;
        }

        pendingScrollYRef.current = scrollY;
        setItems(mergedItems);
        setNextCursor(cursor);
        setHasMore(more);
      } catch {
        if (!cancelled && generation === restoreGenerationRef.current) {
          pendingScrollYRef.current = scrollY;
        }
      } finally {
        if (!cancelled && generation === restoreGenerationRef.current) {
          clearListScrollPayload(scrollStorageKey);
          setIsRestoring(false);
        }
      }
    }

    void restoreScroll();

    return () => {
      cancelled = true;
    };
  }, [scrollStorageKey, channel, sort, topic, homeReturnPath]);

  useLayoutEffect(() => {
    const scrollY = pendingScrollYRef.current;
    if (scrollY == null || isRestoring) {
      return;
    }

    pendingScrollYRef.current = null;

    if (useVirtualLayout) {
      virtualizer.scrollToOffset(scrollY, { align: "start" });

      void (async () => {
        await waitForNextFrame();
        await waitForNextFrame();
        window.scrollTo(0, scrollY);
        virtualizer.scrollToOffset(scrollY, { align: "start" });
      })();
      return;
    }

    window.scrollTo(0, scrollY);
  }, [items, isRestoring, useVirtualLayout, virtualizer]);

  useEffect(() => {
    if (isRestoring) {
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, isRestoring]);

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div className="px-5 py-2">
      {isRestoring ? (
        <p className="py-8 text-center text-sm text-zinc-500">正在恢复浏览位置…</p>
      ) : null}

      {useVirtualLayout ? (
        <div
          ref={listRef}
          className="relative w-full"
          style={{
            height: isRestoring ? 0 : virtualizer.getTotalSize(),
            overflow: isRestoring ? "hidden" : undefined,
            visibility: isRestoring ? "hidden" : "visible",
          }}
        >
          {virtualRows.map((virtualRow) => {
            const item = items[virtualRow.index];
            if (!item) {
              return null;
            }

            return (
              <div
                key={item.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                  paddingBottom: LIST_GAP_PX,
                }}
              >
                {renderFeedListItem({
                  channel,
                  homeReturnPath,
                  item,
                  scrollLoadedCount: items.length,
                  scrollStorageKey,
                })}
              </div>
            );
          })}
        </div>
      ) : (
        <div ref={listRef} className="w-full">
          {items.map((item) => (
            <div key={item.id}>
              {renderFeedListItem({
                channel,
                homeReturnPath,
                item,
                scrollLoadedCount: items.length,
                scrollStorageKey,
              })}
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4 w-full" aria-hidden />

      {isFetching ? (
        <div className="py-2">
          <ListItemSkeleton variant={skeletonVariant} withAvatar={skeletonVariant === "default"} />
          <ListItemSkeleton
            variant={skeletonVariant}
            withAvatar={skeletonVariant === "default"}
            withCover
          />
        </div>
      ) : null}

      {!hasMore && items.length > 0 && !isFetching ? (
        <p className="py-6 text-center text-sm text-zinc-400">没有更多了</p>
      ) : null}

      {fetchError ? (
        <div className="py-4 text-center">
          <p className="text-sm text-red-500">加载失败，点击重试</p>
          <button
            className="mt-2 text-sm font-medium text-brand-primary hover:underline"
            onClick={() => void fetchNextPage()}
            type="button"
          >
            重试
          </button>
        </div>
      ) : null}
    </div>
  );
}
