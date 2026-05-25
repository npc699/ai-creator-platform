import { formatFeedScoreLabel } from "@/lib/feed/format-score";
import { badgeArticleScore, badgeArticleTag } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type ArticleMetaBadgesProps = {
  score: number;
  tags?: string[];
  className?: string;
};

/** 质量分（蓝）+ 标签（灰）横排展示，质量分固定在前。 */
export function ArticleMetaBadges({
  score,
  tags = [],
  className,
}: ArticleMetaBadgesProps) {
  if (!score && tags.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className={badgeArticleScore}>{formatFeedScoreLabel(score)}</span>
      {tags.map((tag) => (
        <span className={badgeArticleTag} key={tag}>
          {tag}
        </span>
      ))}
    </div>
  );
}
