import { formatPostArticleDate } from "@/lib/posts/feed-item";
import { buildPostHref } from "@/lib/posts/reader-navigation";

import { FeedListItem } from "../feed/card";

export type AuthorProfilePostItemProps = {
  postId: string;
  title: string;
  excerpt: string;
  coverUrl?: string | null;
  score: number | null;
  tags?: string[];
  views: number;
  likes: number;
  publishedAt: Date | null;
  updatedAt: Date;
  authorProfilePath: string;
};

/** 发布者主页文章列表行，复用 FeedListItem 单元格壳。 */
export function AuthorProfilePostItem({
  postId,
  title,
  excerpt,
  coverUrl,
  score,
  tags = [],
  views,
  likes,
  publishedAt,
  updatedAt,
  authorProfilePath,
}: AuthorProfilePostItemProps) {
  const dateLabel = publishedAt
    ? formatPostArticleDate(publishedAt)
    : formatPostArticleDate(updatedAt);

  return (
    <FeedListItem
      coverUrl={coverUrl}
      dateLabel={dateLabel}
      excerpt={excerpt}
      hideAuthorRow
      href={buildPostHref(postId, authorProfilePath)}
      likes={likes}
      metaDisplay="combined"
      readOnlyMetrics
      score={score}
      showMetrics
      tags={tags}
      title={title}
      views={views}
    />
  );
}
