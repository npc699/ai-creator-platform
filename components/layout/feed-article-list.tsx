import { FeedArticleCard } from "@/components/layout/feed-article-card";
import type { FeedArticleItem } from "@/lib/feed/types";

type FeedArticleListProps = {
  items: FeedArticleItem[];
  /** 传入时在点击卡片进入详情前写入 sessionStorage，配合 FeedScrollRestore 使用。 */
  scrollStorageKey?: string;
};

export function FeedArticleList({ items, scrollStorageKey }: FeedArticleListProps) {
  return (
    <div className="space-y-4 p-4">
      {items.map(({ id, persistMetrics, likedByViewer, canLike, ...item }) => (
        <FeedArticleCard
          key={id}
          {...item}
          canLike={canLike}
          initialLiked={likedByViewer}
          postId={persistMetrics ? id : undefined}
          scrollStorageKey={scrollStorageKey}
        />
      ))}
    </div>
  );
}
