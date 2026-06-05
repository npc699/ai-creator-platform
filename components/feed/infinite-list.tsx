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
  clearFeedScrollPayload,
  readFeedScrollPayload,
} from "./scroll-restore";
import type { FeedChannelParam, FeedSort } from "@/lib/feed/params";
import type { HomeFeedListItem as HomeFeedListItemData, HomeFeedPageResult } from "@/lib/posts/home-feed-query";
import { mergeUniqueFeedItems } from "@/lib/posts/merge-feed-items";

import { FeedListItemSkeleton } from "./skeleton";
import {
  HomeFeedListItem,
  HotFeedListItem,
  ViralFeedListItem,
} from "./card";

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

function buildHomeFeedApiUrl(options: {
  channel: FeedChannelParam;
  sort: FeedSort;
  topic: string | null;
  homeReturnPath: string;
  cursor?: string | null;
}) {
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
  options: Parameters<typeof buildHomeFeedApiUrl>[0]
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
    () => readFeedScrollPayload(scrollStorageKey) != null
  );
  const [trackedScrollKey, setTrackedScrollKey] = useState(scrollStorageKey);
  const [scrollMargin, setScrollMargin] = useState(0);

  // scrollStorageKey 变化时在 render 阶段同步恢复态，避免 effect 内 setState(true)。
  if (scrollStorageKey !== trackedScrollKey) {
    setTrackedScrollKey(scrollStorageKey);
    setIsRestoring(readFeedScrollPayload(scrollStorageKey) != null);
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

  useLayoutEffect(() => {
    function updateScrollMargin() {
      setScrollMargin(listRef.current?.offsetTop ?? 0);
    }

    updateScrollMargin();
    window.addEventListener("resize", updateScrollMargin);
    return () => window.removeEventListener("resize", updateScrollMargin);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
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

  // 深滚后从详情返回：预拉取至 saved loadedCount，再恢复 scrollY
  useEffect(() => {
    const payload = readFeedScrollPayload(scrollStorageKey);
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
          clearFeedScrollPayload(scrollStorageKey);
          setIsRestoring(false);
        }
      }
    }

    void restoreScroll();

    return () => {
      cancelled = true;
    };
  }, [scrollStorageKey, channel, sort, topic, homeReturnPath]);

  // 列表渲染完成后再滚动，避免虚拟列表高度为 0 时 scrollTo 失效
  useLayoutEffect(() => {
    const scrollY = pendingScrollYRef.current;
    if (scrollY == null || isRestoring) {
      return;
    }

    pendingScrollYRef.current = null;

    virtualizer.scrollToOffset(scrollY, { align: "start" });

    void (async () => {
      await waitForNextFrame();
      await waitForNextFrame();
      window.scrollTo(0, scrollY);
      virtualizer.scrollToOffset(scrollY, { align: "start" });
    })();
    // virtualizer 随 items 更新，与 items 同步触发即可
  }, [items, isRestoring, virtualizer]);

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

          const { id, likedByViewer, canLike, rank, isRisingFast, sustainedHotDays, ...cardProps } =
            item;

          return (
            <div
              key={id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
                paddingBottom: LIST_GAP_PX,
              }}
            >
              {channel === "hot" && rank != null ? (
                <HotFeedListItem
                  {...cardProps}
                  canLike={canLike}
                  initialLiked={likedByViewer}
                  isRisingFast={isRisingFast}
                  postId={id}
                  profileReturnPath={homeReturnPath}
                  rank={rank}
                  scrollLoadedCount={items.length}
                  scrollStorageKey={scrollStorageKey}
                />
              ) : channel === "viral" ? (
                <ViralFeedListItem
                  {...cardProps}
                  canLike={canLike}
                  initialLiked={likedByViewer}
                  postId={id}
                  profileReturnPath={homeReturnPath}
                  scrollLoadedCount={items.length}
                  scrollStorageKey={scrollStorageKey}
                  sustainedHotDays={sustainedHotDays}
                />
              ) : (
                <HomeFeedListItem
                  {...cardProps}
                  canLike={canLike}
                  initialLiked={likedByViewer}
                  postId={id}
                  profileReturnPath={homeReturnPath}
                  scrollLoadedCount={items.length}
                  scrollStorageKey={scrollStorageKey}
                />
              )}
            </div>
          );
        })}
      </div>

      <div ref={sentinelRef} className="h-4 w-full" aria-hidden />

      {isFetching ? (
        <div className="py-2">
          <FeedListItemSkeleton variant={skeletonVariant} withAvatar={skeletonVariant === "default"} />
          <FeedListItemSkeleton
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
