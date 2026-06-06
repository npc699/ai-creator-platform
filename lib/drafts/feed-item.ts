import { buildFeedListExcerpt } from "@/lib/posts/excerpt";
import type { FeedArticleItem } from "@/lib/posts/list-types";
import { formatPublishedTime, getAuthorLabel } from "@/lib/posts/feed-item";

export { getAuthorLabel, formatPublishedTime };

type DraftRecord = {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
  coverUrl?: string | null;
  prompt: { title: string } | null;
};

/** 将 Draft 转为 Feed 卡片数据结构。 */
export function mapDraftToFeedItem(
  draft: DraftRecord,
  authorLabel: string,
  authorId = ""
): FeedArticleItem {
  const coverUrl = draft.coverUrl ?? null;

  return {
    id: draft.id,
    author: authorLabel,
    authorId,
    time: formatPublishedTime(draft.updatedAt),
    title: draft.title || "无标题草稿",
    excerpt: buildFeedListExcerpt(draft.content, Boolean(coverUrl)),
    score: null,
    views: 0,
    likes: 0,
    href: `/editor?draftId=${draft.id}`,
    coverUrl,
  };
}
