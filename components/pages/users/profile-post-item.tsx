import { ArticleListItem } from "@/components/article";
import { formatPostArticleDate } from "@/lib/posts/feed-item";
import { buildPostHref } from "@/lib/posts/reader-navigation";

type ProfilePostItemProps = {
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

/** 发布者主页文章列表行，复用 ArticleListItem 单元格壳。 */
function ProfilePostItem({
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
}: ProfilePostItemProps) {
  const dateLabel = publishedAt
    ? formatPostArticleDate(publishedAt)
    : formatPostArticleDate(updatedAt);

  return (
    <ArticleListItem
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

export { ProfilePostItem };
