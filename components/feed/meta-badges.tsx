import { formatFeedScoreLabel } from "@/lib/feed/format-score";
import { getQualityScoreBadgeClass, getQualityTierMeta } from "@/lib/feed/quality-tier";
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
