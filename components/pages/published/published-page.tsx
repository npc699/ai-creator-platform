import {
  ArticleList,
  EditorLinkEmptyState,
  ListScrollRestore,
} from "@/components/article";
import type { FeedArticleItem } from "@/lib/posts/list-types";
import type { PublishedFilter } from "@/lib/posts/panel-params";
import { getPublishedEmptyMessage } from "@/lib/posts/published-list";

type PublishedPageProps = {
  feedItems: FeedArticleItem[];
  filter: PublishedFilter;
  scrollStorageKey: string;
};

/** 已发布页主体：滚动恢复 + 空态或文章列表。 */
export function PublishedPage({
  feedItems,
  filter,
  scrollStorageKey,
}: PublishedPageProps) {
  return (
    <>
      <ListScrollRestore storageKey={scrollStorageKey} />
      {feedItems.length === 0 ? (
        <EditorLinkEmptyState
          actionHref="/editor"
          actionLabel="去编辑器创作"
          message={getPublishedEmptyMessage(filter)}
        />
      ) : (
        <ArticleList items={feedItems} scrollStorageKey={scrollStorageKey} />
      )}
    </>
  );
}
