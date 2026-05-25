import { formatFeedScoreLabel } from "@/lib/feed/format-score";
import { badgeArticleScore, badgeArticleTag } from "@/lib/utils/brand";
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

/** 质量分（蓝）/ 待审核（橙）+ 标签（灰）横排展示。 */
export function ArticleMetaBadges({
  score,
  tags = [],
  reviewPending,
  className,
}: ArticleMetaBadgesProps) {
  if (score === null && !reviewPending && tags.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {score !== null ? (
        <span className={badgeArticleScore}>{formatFeedScoreLabel(score)}</span>
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
