"use client";

import { Eye, Heart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { formatFeedMetric } from "@/lib/feed/format-metric";
import { formatFeedScoreLabel } from "@/lib/feed/format-score";
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
};

export function FeedArticleCard({
  author,
  time,
  title,
  excerpt,
  score,
  views,
  likes,
  href,
  singleLineExcerpt = false,
  publishStatus,
  postId,
  canLike = false,
  initialLiked = false,
  isDeleting = false,
  onDelete,
  showMetrics = true,
}: FeedArticleCardProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const [isLikePending, setIsLikePending] = useState(false);
  const [likeError, setLikeError] = useState<string | null>(null);

  useEffect(() => {
    setLiked(initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    setLikeCount(likes);
  }, [likes]);

  const titleClassName =
    "mt-4 max-w-[75%] truncate text-lg font-semibold leading-7 text-zinc-900";

  async function handleLikeToggle() {
    if (isLikePending) {
      return;
    }

    setLikeError(null);

    if (!postId) {
      setLiked((previous) => !previous);
      setLikeCount((previous) => (liked ? previous - 1 : previous + 1));
      return;
    }

    if (!canLike) {
      setLikeError("请先登录后再点赞");
      return;
    }

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((previous) => (nextLiked ? previous + 1 : previous - 1));
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
        setLiked(!nextLiked);
        setLikeCount((previous) => (nextLiked ? previous - 1 : previous + 1));
        setLikeError(payload?.error ?? "点赞失败，请稍后重试");
        return;
      }

      const data = (await response.json()) as {
        liked: boolean;
        likeCount: number;
      };
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      setLiked(!nextLiked);
      setLikeCount((previous) => (nextLiked ? previous - 1 : previous + 1));
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
        />
      ) : null}

      {onDelete ? (
        <button
          aria-busy={isDeleting}
          aria-label="删除草稿"
          className={cn(
            "pointer-events-auto absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5",
            "text-sm font-medium text-red-700 transition",
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
          {isDeleting ? "删除中…" : "删除"}
        </button>
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
          <div className="flex flex-wrap items-center gap-2">
            {publishStatus ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                  publishStatus === "online"
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-amber-50 text-amber-800 ring-amber-200"
                )}
              >
                {publishStatus === "online" ? "已上线" : "已下线"}
              </span>
            ) : null}
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
              {formatFeedScoreLabel(score)}
            </span>
          </div>

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
