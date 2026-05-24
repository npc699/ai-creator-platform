import { FeedArticleCard } from "@/components/layout/feed-article-card";
import type { FeedArticleItem } from "@/lib/feed/types";

type FeedArticleListProps = {
  items: FeedArticleItem[];
};

export function FeedArticleList({ items }: FeedArticleListProps) {
  return (
    <div className="space-y-4 p-4">
      {items.map(({ id, persistMetrics, likedByViewer, canLike, ...item }) => (
        <FeedArticleCard
          key={id}
          {...item}
          canLike={canLike}
          initialLiked={likedByViewer}
          postId={persistMetrics ? id : undefined}
        />
      ))}
    </div>
  );
}
