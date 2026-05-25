"use client";

import { Eye, Heart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ArticleMetaBadges } from "@/components/layout/article-meta-badges";
import { saveFeedScrollPosition } from "@/components/layout/feed-scroll-restore";
import { formatFeedMetric } from "@/lib/feed/format-metric";
import type { FeedArticleItem } from "@/lib/feed/types";
import { cn } from "@/lib/utils";

export type FeedArticleCardProps = Omit<
  FeedArticleItem,
  "id" | "persistMetrics" | "likedByViewer" | "canLike"
> & {
  postId?: string;
  canLike?: boolean;
  initialLiked?: boolean;
  isDeleting?: boolean;
  onDelete?: () => void;
  showMetrics?: boolean;
  /** 跳转详情前写入 sessionStorage，配合 FeedScrollRestore 恢复列表滚动位置。 */
  scrollStorageKey?: string;
  /** 首页分页列表：已加载条数，用于返回时预拉取到同等深度。 */
  scrollLoadedCount?: number;
};

export function FeedArticleCard({
  author,
  time,
  title,
  excerpt,
  score,
  tags = [],
  views,
  likes,
  href,
  singleLineExcerpt = false,
  publishStatus,
  reviewPending,
  postId,
  canLike = false,
  initialLiked = false,
  isDeleting = false,
  onDelete,
  showMetrics = true,
  scrollStorageKey,
  scrollLoadedCount,
}: FeedArticleCardProps) {
  const sourceKey = `${postId ?? ""}:${initialLiked}:${likes}`;
  const [syncedKey, setSyncedKey] = useState(sourceKey);
  const [optimisticLike, setOptimisticLike] = useState<{
    liked: boolean;
    likeCount: number;
  } | null>(null);
  const [isLikePending, setIsLikePending] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);

  // 父级数据刷新时重置乐观状态，避免 effect 内 setState。
  if (!isLikePending && sourceKey !== syncedKey) {
    setSyncedKey(sourceKey);
    setOptimisticLike(null);
  }

  const liked = optimisticLike?.liked ?? initialLiked;
  const likeCount = optimisticLike?.likeCount ?? likes;

  const titleClassName =
    "mt-4 max-w-[75%] truncate text-lg font-semibold leading-7 text-zinc-900";

  async function handleLikeToggle() {
    if (isLikePending) {
      return;
    }

    setLikeError(null);

    if (!postId) {
      const nextLiked = !liked;
      setOptimisticLike({
        liked: nextLiked,
        likeCount: nextLiked ? likeCount + 1 : likeCount - 1,
      });
      return;
    }

    if (!canLike) {
      setLikeError("请先登录后再点赞");
      return;
    }

    const nextLiked = !liked;
    const optimisticCount = nextLiked ? likeCount + 1 : likeCount - 1;
    setOptimisticLike({ liked: nextLiked, likeCount: optimisticCount });
    setIsLikePending(true);

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setOptimisticLike({ liked: !nextLiked, likeCount: likeCount });
        setLikeError(payload?.error ?? "点赞失败，请稍后重试");
        return;
      }

      const data = (await response.json()) as {
        liked: boolean;
        likeCount: number;
      };
      setOptimisticLike({ liked: data.liked, likeCount: data.likeCount });
    } catch {
      setOptimisticLike({ liked: !nextLiked, likeCount: likeCount });
      setLikeError("点赞失败，请稍后重试");
    } finally {
      setIsLikePending(false);
    }
  }

  return (
    <article
      className={cn(
        "relative rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md",
        href && "cursor-pointer"
      )}
    >
      {href ? (
        <Link
          aria-label={`查看文章：${title}`}
          className="absolute inset-0 z-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
          href={href}
          onClick={() => {
            if (scrollStorageKey) {
              saveFeedScrollPosition(scrollStorageKey, scrollLoadedCount);
            }
          }}
          onPointerDown={() => {
            // 早于路由切换写入，避免个别环境下 onClick 未触发导致无法恢复滚动
            if (scrollStorageKey) {
              saveFeedScrollPosition(scrollStorageKey, scrollLoadedCount);
            }
          }}
        />
      ) : null}

      {onDelete ? (
        <button
          aria-busy={isDeleting}
          aria-label={isDeleting ? "删除中" : "删除草稿"}
          className={cn(
            "pointer-events-auto absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg",
            "text-red-700 transition",
            "hover:bg-red-50 hover:text-red-800",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
          )}
          disabled={isDeleting}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete();
          }}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}

      {publishStatus ? (
        <span
          aria-label={publishStatus === "online" ? "已上线" : "已下线"}
          className={cn(
            "pointer-events-none absolute right-4 top-4 z-10 h-2.5 w-2.5 rounded-full ring-2 ring-white",
            publishStatus === "online" ? "bg-emerald-500" : "bg-amber-400"
          )}
          role="img"
          title={publishStatus === "online" ? "已上线" : "已下线"}
        />
      ) : null}

      <div className="relative z-[1] pointer-events-none">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
            {author.slice(0, 1)}
          </span>
          <div>
            <p className="text-sm font-medium text-zinc-900">{author}</p>
            <p className="text-xs text-zinc-500">{time}</p>
          </div>
        </div>

        <h3 className={titleClassName}>{title}</h3>

        <p
          className={cn(
            "mt-2 max-w-[80%] text-sm leading-6 text-zinc-600",
            singleLineExcerpt && "truncate"
          )}
        >
          {excerpt}
        </p>

        <div
          className={cn(
            "mt-4 flex flex-wrap items-center gap-3",
            showMetrics && "justify-between"
          )}
        >
          <ArticleMetaBadges reviewPending={reviewPending} score={score} tags={tags} />

          {showMetrics ? (
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {formatFeedMetric(views)}
                </span>
                <button
                  aria-busy={isLikePending}
                  aria-label={liked ? "取消点赞" : "点赞"}
                  aria-pressed={liked}
                  className={cn(
                    "pointer-events-auto relative z-10 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors",
                    liked
                      ? "text-red-500"
                      : "text-zinc-500 hover:bg-red-50 hover:text-red-500",
                    isLikePending && "opacity-60"
                  )}
                  disabled={isLikePending}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void handleLikeToggle();
                  }}
                  title={postId && !canLike ? "请先登录后再点赞" : undefined}
                  type="button"
                >
                  <Heart
                    className={cn(
                      "h-4 w-4 transition-colors",
                      liked && "fill-red-500 text-red-500"
                    )}
                  />
                  {formatFeedMetric(likeCount)}
                </button>
              </div>
              {likeError ? (
                <p className="pointer-events-none text-xs text-red-500">
                  {likeError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
