"use client";

import { Clock, Eye, Heart, Trash2, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ArticleMetaBadges } from "@/components/layout/article-meta-badges";
import { AuthorProfileLink } from "@/components/layout/author-profile-link";
import { FeedCardCover } from "@/components/layout/feed-card-cover";
import { saveFeedScrollPosition } from "@/components/layout/feed-scroll-restore";
import { useFeedLikeToggle } from "@/components/layout/use-feed-like-toggle";
import { formatFeedMetric } from "@/lib/feed/format-metric";
import { getHotRankBadgeClass } from "@/lib/feed/hot-rank-style";
import { getQualityTierMeta } from "@/lib/feed/quality-tier";
import { cn } from "@/lib/utils";
import { badgeArticleTag } from "@/lib/utils/brand";

export type FeedListItemProps = {
  postId?: string;
  author?: string;
  authorId?: string;
  authorImage?: string | null;
  profileReturnPath?: string | null;
  time?: string;
  title: string;
  excerpt: string;
  tags?: string[];
  score?: number | null;
  reviewPending?: boolean;
  views: number;
  likes: number;
  href?: string;
  coverUrl?: string | null;
  canLike?: boolean;
  initialLiked?: boolean;
  scrollStorageKey?: string;
  scrollLoadedCount?: number;
  /** 左侧锚点：排名、质量分等 */
  leading?: ReactNode;
  topRightBadge?: ReactNode;
  coverPriority?: boolean;
  /** 作者行是否展示头像；false 时为榜单式「名 · 时间」 */
  showAuthorAvatar?: boolean;
  /** 隐藏作者行（发布者主页等） */
  hideAuthorRow?: boolean;
  /** 无作者行时在指标区展示日期 */
  dateLabel?: string;
  showMetrics?: boolean;
  /** 仅展示静态点赞数，不可交互 */
  readOnlyMetrics?: boolean;
  /** combined：质量分/审核/标签；tags-only：灰色标签 pill（榜单） */
  metaDisplay?: "combined" | "tags-only";
  onDelete?: () => void;
  isDeleting?: boolean;
  publishStatus?: "online" | "offline";
};

function FeedListAuthorRow({
  author,
  authorId,
  authorImage,
  time,
  topRightBadge,
  profileReturnPath,
  showAuthorAvatar,
}: {
  author: string;
  authorId: string;
  authorImage?: string | null;
  time?: string;
  topRightBadge?: ReactNode;
  profileReturnPath?: string | null;
  showAuthorAvatar: boolean;
}) {
  if (showAuthorAvatar) {
    return (
      <div className="flex items-center gap-2">
        <AuthorProfileLink
          authorId={authorId}
          authorImage={authorImage}
          authorName={author}
          returnPath={profileReturnPath}
          stopPropagation
          subtitle={time ? <p className="text-xs text-zinc-500">{time}</p> : undefined}
        />
        {topRightBadge ? <div className="ml-auto shrink-0">{topRightBadge}</div> : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <AuthorProfileLink
        authorId={authorId}
        authorImage={authorImage}
        authorName={author}
        nameClassName="font-normal text-zinc-600"
        returnPath={profileReturnPath}
        showAvatar={false}
        stopPropagation
      />
      {time ? <span className="shrink-0 text-sm text-zinc-400"> · {time}</span> : null}
      {topRightBadge ? <div className="ml-auto shrink-0">{topRightBadge}</div> : null}
    </div>
  );
}

/** 全站 Feed 列表统一单元格行：面板内扁平行 + border-b 分隔。 */
export function FeedListItem({
  postId,
  author,
  authorId,
  authorImage,
  profileReturnPath,
  time,
  title,
  excerpt,
  tags = [],
  score = null,
  reviewPending,
  views,
  likes,
  href,
  coverUrl,
  canLike = false,
  initialLiked = false,
  scrollStorageKey,
  scrollLoadedCount,
  leading,
  topRightBadge,
  coverPriority = false,
  showAuthorAvatar = true,
  hideAuthorRow = false,
  dateLabel,
  showMetrics = true,
  readOnlyMetrics = false,
  metaDisplay = "combined",
  onDelete,
  isDeleting = false,
  publishStatus,
}: FeedListItemProps) {
  const { liked, likeCount, isLikePending, likeError, handleLikeToggle } =
    useFeedLikeToggle({
      postId,
      canLike,
      initialLiked,
      likes,
    });

  const showAuthorRow = !hideAuthorRow && Boolean(author && authorId);
  const showCombinedMeta =
    metaDisplay === "combined" &&
    (score != null || reviewPending || tags.length > 0);
  const showTagPills = metaDisplay === "tags-only" && tags.length > 0;
  const showMetaRow = showCombinedMeta || showTagPills;
  const showFooterRow = showMetaRow || showMetrics || Boolean(dateLabel);

  const metricsBlock = showMetrics ? (
    <div className="ml-auto flex shrink-0 items-center gap-3 text-sm text-zinc-500">
      <span className="inline-flex items-center gap-1">
        <Eye className="h-3.5 w-3.5" aria-hidden />
        {formatFeedMetric(views)}
      </span>
      {readOnlyMetrics ? (
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" aria-hidden />
          {formatFeedMetric(likes)}
        </span>
      ) : (
        <button
          aria-busy={isLikePending}
          aria-label={liked ? "取消点赞" : "点赞"}
          aria-pressed={liked}
          className={cn(
            "pointer-events-auto relative z-10 inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors",
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
              "h-3.5 w-3.5 transition-colors",
              liked && "fill-red-500 text-red-500"
            )}
          />
          {formatFeedMetric(likeCount)}
        </button>
      )}
    </div>
  ) : null;

  const deleteButton =
    onDelete != null ? (
      <button
        aria-busy={isDeleting}
        aria-label={isDeleting ? "删除中" : "删除草稿"}
        className={cn(
          "pointer-events-auto z-10 inline-flex h-6 w-6 items-center justify-center rounded-md",
          "text-red-600 transition",
          "hover:bg-red-50 hover:text-red-700",
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
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    ) : null;

  return (
    <article
      className={cn(
        "relative border-b border-zinc-200 py-4 transition-colors hover:bg-zinc-50/80",
        href && "cursor-pointer"
      )}
    >
      {href ? (
        <Link
          aria-label={`查看文章：${title}`}
          className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
          href={href}
          onClick={() => {
            if (scrollStorageKey) {
              saveFeedScrollPosition(scrollStorageKey, scrollLoadedCount);
            }
          }}
          onPointerDown={() => {
            if (scrollStorageKey) {
              saveFeedScrollPosition(scrollStorageKey, scrollLoadedCount);
            }
          }}
        />
      ) : null}

      {onDelete ? (
        <div className="pointer-events-none absolute right-4 top-2.5 z-10">{deleteButton}</div>
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

      <div className="relative z-[1] pointer-events-none flex items-start gap-3">
        {leading}

        <div className="min-w-0 flex-1">
          {showAuthorRow ? (
            <FeedListAuthorRow
              author={author!}
              authorId={authorId!}
              authorImage={authorImage}
              profileReturnPath={profileReturnPath}
              showAuthorAvatar={showAuthorAvatar}
              time={time}
              topRightBadge={topRightBadge}
            />
          ) : null}

          <div className={cn("flex items-start gap-3", showAuthorRow && "mt-2")}>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold text-zinc-900">{title}</h3>

              {excerpt ? (
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600">{excerpt}</p>
              ) : null}
            </div>

            {coverUrl ? (
              <FeedCardCover
                alt=""
                priority={coverPriority}
                size="compact"
                src={coverUrl}
              />
            ) : null}
          </div>

          {showFooterRow ? (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                {dateLabel ? (
                  <span className="text-sm text-zinc-500">{dateLabel}</span>
                ) : null}
                {showMetaRow ? (
                  metaDisplay === "combined" ? (
                    <ArticleMetaBadges
                      reviewPending={reviewPending}
                      score={score}
                      tags={tags}
                    />
                  ) : (
                    <>
                      {tags.map((tag) => (
                        <span className={badgeArticleTag} key={tag}>
                          {tag}
                        </span>
                      ))}
                    </>
                  )
                ) : null}
              </div>
              {metricsBlock}
            </div>
          ) : null}

          {!readOnlyMetrics && likeError ? (
            <p className="pointer-events-none mt-1 text-xs text-red-500">{likeError}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function HotRankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold",
        getHotRankBadgeClass(rank)
      )}
    >
      {rank}
    </span>
  );
}

export function ViralQualityBlock({ score }: { score: number | null }) {
  const tierMeta = score != null ? getQualityTierMeta(score) : null;
  const blockClass = tierMeta?.blockClass ?? {
    container: "bg-zinc-100",
    score: "text-zinc-500",
    caption: "text-zinc-400",
  };

  return (
    <div
      className={cn(
        "flex h-[72px] w-12 shrink-0 flex-col items-center justify-center rounded-lg",
        blockClass.container
      )}
      title={tierMeta ? `${tierMeta.label}（${score} 分）` : undefined}
    >
      <span className={cn("text-xl font-bold leading-none", blockClass.score)}>
        {score ?? "—"}
      </span>
      <span className={cn("mt-1 text-[10px] font-medium", blockClass.caption)}>
        质量分
      </span>
    </div>
  );
}

export function RisingFastBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      <TrendingUp className="h-3 w-3" aria-hidden />
      快速上升
    </span>
  );
}

export function SustainedHotBadge({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
      <Clock className="h-3 w-3" aria-hidden />
      持续热门 {days} 天
    </span>
  );
}
