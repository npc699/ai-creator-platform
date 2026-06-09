import { Clock, TrendingUp } from "lucide-react";

import { formatFeedScoreLabel } from "@/lib/feed/format";
import {
  getHotRankBadgeClass,
  getQualityScoreBadgeClass,
  getQualityTierMeta,
} from "@/lib/feed/badges";
import { badgeArticleTag } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type ArticleMetaBadgesProps = {
  score: number | null;
  tags?: string[];
  reviewPending?: boolean;
  className?: string;
};

const badgeReviewWarning = [
  "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
  "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
].join(" ");

/** 质量分（按档位配色）/ 待审核（橙）+ 标签（灰）横排展示。 */
export function ArticleMetaBadges({
  score,
  tags = [],
  reviewPending,
  className,
}: ArticleMetaBadgesProps) {
  if (score === null && !reviewPending && tags.length === 0) {
    return null;
  }

  const scoreTierMeta = score !== null ? getQualityTierMeta(score) : null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {score !== null ? (
        <span
          className={getQualityScoreBadgeClass(score)}
          title={`${scoreTierMeta?.label ?? ""}（${score} 分）`}
        >
          {formatFeedScoreLabel(score)}
        </span>
      ) : null}
      {reviewPending ? (
        <span className={badgeReviewWarning}>待审核</span>
      ) : null}
      {tags.map((tag) => (
        <span className={badgeArticleTag} key={tag}>
          {tag}
        </span>
      ))}
    </div>
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
