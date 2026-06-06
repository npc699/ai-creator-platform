"use client";

import { AlertTriangle, Eye, Heart, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ArticleMetaBadges, useArticleLikeToggle } from "@/components/article";
import { AuthorAvatar } from "@/components/author";
import { formatFeedMetric } from "@/lib/feed/format";
import { buildAuthorProfileHref } from "@/lib/users/profile-navigation";
import { cn } from "@/lib/utils";

const TOAST_MESSAGES: Record<
  string,
  { text: string; tone: "success" | "warning" }
> = {
  success: { text: "内容审核通过，发布成功", tone: "success" },
  pending: { text: "发布成功，内容已进入待审核状态", tone: "warning" },
  reviewed: { text: "内容已保存，重新审核通过", tone: "success" },
};

const TOAST_DURATION_MS = 6000;

export type ReaderArticleMetaProps = {
  title: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  authorReturnPath?: string | null;
  publishedLabel: string;
  postId: string;
  trackViews: boolean;
  viewCount: number;
  likeCount: number;
  score: number | null;
  tags: string[];
  reviewPending?: boolean;
  canLike?: boolean;
  initialLiked?: boolean;
  showReviewBanner?: boolean;
};

// --- Published toast ---

function PublishedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const publishedParam = searchParams.get("published");
  const entry = publishedParam ? TOAST_MESSAGES[publishedParam] : null;
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  const dismiss = useCallback(() => {
    if (publishedParam) {
      setDismissedFor(publishedParam);
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("published");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [publishedParam, router]);

  useEffect(() => {
    if (!entry || dismissedFor === publishedParam) {
      return;
    }
    const timer = window.setTimeout(dismiss, TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [dismiss, dismissedFor, entry, publishedParam]);

  if (!entry || dismissedFor === publishedParam) {
    return null;
  }

  const isWarning = entry.tone === "warning";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        aria-live="polite"
        className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-medium shadow-lg",
          isWarning
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        )}
      >
        <span>{entry.text}</span>
        <button
          aria-label="关闭提示"
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition",
            isWarning
              ? "text-amber-600 hover:bg-amber-100"
              : "text-emerald-600 hover:bg-emerald-100"
          )}
          onClick={dismiss}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// --- Metrics ---

function ArticleMetrics({
  postId,
  publishedLabel,
  viewCount: initialViewCount,
  likeCount,
  trackViews,
  canLike = false,
  initialLiked = false,
}: {
  postId: string;
  publishedLabel: string;
  viewCount: number;
  likeCount: number;
  trackViews: boolean;
  canLike?: boolean;
  initialLiked?: boolean;
}) {
  const [viewCount, setViewCount] = useState(initialViewCount);
  const trackedRef = useRef<string | null>(null);
  const viewKey = `${postId}:${initialViewCount}`;
  const [syncedViewKey, setSyncedViewKey] = useState(viewKey);

  if (viewKey !== syncedViewKey) {
    setSyncedViewKey(viewKey);
    setViewCount(initialViewCount);
  }

  const {
    liked,
    likeCount: displayLikeCount,
    isLikePending,
    likeError,
    handleLikeToggle,
  } = useArticleLikeToggle({
    postId,
    canLike,
    initialLiked,
    likes: likeCount,
  });

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
            onClick={(event) => {
              event.preventDefault();
              void handleLikeToggle();
            }}
            type="button"
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5",
                liked && "fill-red-500 text-red-500"
              )}
            />
            {formatFeedMetric(displayLikeCount)}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1" title="点赞">
            <Heart className="h-3.5 w-3.5" />
            {formatFeedMetric(displayLikeCount)}
          </span>
        )}
      </p>
      {likeError ? (
        <p className="mt-1 text-xs text-red-500">{likeError}</p>
      ) : null}
    </div>
  );
}

// --- Review banner ---

function ReviewPendingBanner({ postId }: { postId: string }) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleRetry() {
    if (isRetrying) {
      return;
    }

    setMessage(null);
    setIsError(false);
    setIsRetrying(true);

    try {
      const response = await fetch("/api/review/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
        credentials: "same-origin",
      });

      const payload = (await response.json().catch(() => null)) as {
        retryStatus?: "completed" | "still_pending";
        error?: string;
      } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? "重新审核失败，请稍后重试");
        setIsError(true);
        return;
      }

      if (payload?.retryStatus === "still_pending") {
        setMessage("AI 服务仍不可用，请稍后再试");
        setIsError(true);
        return;
      }

      setMessage("审核完成，正在刷新页面…");
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试");
      setIsError(true);
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900">
            内容审核未完成，暂无质量评分
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-700">
            缺少质量分的文章在推荐中权重较低，建议重新审核以获取评分。
          </p>
          {message ? (
            <p
              className={cn(
                "mt-2 text-xs leading-5",
                isError ? "text-red-600" : "text-emerald-600"
              )}
            >
              {message}
            </p>
          ) : null}
          <button
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-sm font-medium text-amber-800 transition",
              "hover:bg-amber-100",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
            disabled={isRetrying}
            onClick={() => void handleRetry()}
            type="button"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", isRetrying && "animate-spin")}
            />
            {isRetrying ? "审核中…" : "重新审核"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 阅读页 meta 区：发布 Toast、标题/作者/指标、审核横幅（不含正文）。 */
export function ReaderArticleMeta({
  title,
  authorId,
  authorName,
  authorImage,
  authorReturnPath,
  publishedLabel,
  postId,
  trackViews,
  viewCount,
  likeCount,
  score,
  tags,
  reviewPending,
  canLike = false,
  initialLiked = false,
  showReviewBanner = false,
}: ReaderArticleMetaProps) {
  const profileHref = authorId
    ? buildAuthorProfileHref(authorId, authorReturnPath)
    : null;

  return (
    <>
      <PublishedToast />

      <header className="mb-0">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {title}
        </h1>

        <div className="mt-5 flex items-center gap-3">
          {profileHref ? (
            <Link className="shrink-0" href={profileHref}>
              <AuthorAvatar authorImage={authorImage} authorName={authorName} />
            </Link>
          ) : (
            <AuthorAvatar authorImage={authorImage} authorName={authorName} />
          )}

          <div className="min-w-0">
            {profileHref ? (
              <Link className="group inline-flex" href={profileHref}>
                <span className="text-sm font-medium text-zinc-900 transition group-hover:underline">
                  {authorName}
                </span>
              </Link>
            ) : (
              <p className="text-sm font-medium text-zinc-900">{authorName}</p>
            )}

            <ArticleMetrics
              canLike={canLike}
              initialLiked={initialLiked}
              likeCount={likeCount}
              postId={postId}
              publishedLabel={publishedLabel}
              trackViews={trackViews}
              viewCount={viewCount}
            />
          </div>
        </div>

        <ArticleMetaBadges
          className="mt-4"
          reviewPending={reviewPending}
          score={score}
          tags={tags}
        />

        <div aria-hidden className="mt-6 border-t border-zinc-200" />
      </header>

      {showReviewBanner ? <ReviewPendingBanner postId={postId} /> : null}
    </>
  );
}

/** @deprecated 使用 ReaderArticleMeta */
export const PostReaderArticle = ReaderArticleMeta;

/** @deprecated 使用 ReaderArticleMetaProps */
export type PostReaderArticleProps = ReaderArticleMetaProps;
