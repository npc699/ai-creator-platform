"use client";

import { Eye, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { formatFeedMetric } from "@/lib/feed/format-metric";
import { cn } from "@/lib/utils";

type PostDetailMetricsProps = {
  postId: string;
  publishedLabel: string;
  viewCount: number;
  likeCount: number;
  /** 已上线文章为 true 时上报阅读并同步展示浏览量。 */
  trackViews: boolean;
  /** 为 true 时点赞可点击并走 API。 */
  canLike?: boolean;
  initialLiked?: boolean;
};

/** 详情页发布时间、浏览与点赞；已发布且可互动时点赞走 /api/posts/[id]/like。 */
export function PostDetailMetrics({
  postId,
  publishedLabel,
  viewCount: initialViewCount,
  likeCount: initialLikeCount,
  trackViews,
  canLike = false,
  initialLiked = false,
}: PostDetailMetricsProps) {
  const [viewCount, setViewCount] = useState(initialViewCount);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [liked, setLiked] = useState(initialLiked);
  const [isLikePending, setIsLikePending] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);
  const trackedRef = useRef<string | null>(null);

  // props 变化时同步本地展示值，避免在 effect 里 setState 引发级联渲染
  const [prevInitialViewCount, setPrevInitialViewCount] =
    useState(initialViewCount);
  if (initialViewCount !== prevInitialViewCount) {
    setPrevInitialViewCount(initialViewCount);
    setViewCount(initialViewCount);
  }

  const [prevLikeProps, setPrevLikeProps] = useState({
    initialLikeCount,
    initialLiked,
  });
  if (
    initialLikeCount !== prevLikeProps.initialLikeCount ||
    initialLiked !== prevLikeProps.initialLiked
  ) {
    setPrevLikeProps({ initialLikeCount, initialLiked });
    setLikeCount(initialLikeCount);
    setLiked(initialLiked);
  }

  useEffect(() => {
    if (!trackViews || trackedRef.current === postId) {
      return;
    }

    trackedRef.current = postId;

    void (async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/view`, {
          method: "POST",
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          recorded?: boolean;
          viewCount?: number;
        };

        if (typeof data.viewCount === "number") {
          setViewCount(data.viewCount);
        } else if (data.recorded) {
          setViewCount((current) => current + 1);
        }
      } catch {
        // 阅读量上报失败不阻断阅读
      }
    })();
  }, [postId, trackViews]);

  async function handleLikeToggle() {
    if (!canLike || isLikePending) {
      if (!canLike) {
        setLikeError("请先登录后再点赞");
      }
      return;
    }

    const nextLiked = !liked;
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(nextLiked);
    setLikeCount(nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1));
    setIsLikePending(true);
    setLikeError(null);

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "点赞失败");
      }

      const data = (await response.json()) as {
        liked: boolean;
        likeCount: number;
      };
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch (error) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      setLikeError(
        error instanceof Error ? error.message : "点赞失败，请稍后重试"
      );
    } finally {
      setIsLikePending(false);
    }
  }

  return (
    <div className="mt-0.5">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
        <span>{publishedLabel}</span>
        <span className="inline-flex items-center gap-1" title="浏览">
          <Eye className="h-3.5 w-3.5" />
          {formatFeedMetric(viewCount)}
        </span>
        {canLike ? (
          <button
            aria-busy={isLikePending}
            aria-label={liked ? "取消点赞" : "点赞"}
            aria-pressed={liked}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-0.5 py-0.5 transition-colors",
              liked
                ? "text-red-500"
                : "text-zinc-500 hover:bg-red-50 hover:text-red-500",
              isLikePending && "opacity-60"
            )}
            disabled={isLikePending}
            onClick={() => void handleLikeToggle()}
            type="button"
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5",
                liked && "fill-red-500 text-red-500"
              )}
            />
            {formatFeedMetric(likeCount)}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1" title="点赞">
            <Heart className="h-3.5 w-3.5" />
            {formatFeedMetric(likeCount)}
          </span>
        )}
      </p>
      {likeError ? <p className="mt-1 text-xs text-red-500">{likeError}</p> : null}
    </div>
  );
}
