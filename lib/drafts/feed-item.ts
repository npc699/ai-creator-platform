import { DEFAULT_FEED_SCORE } from "@/lib/feed/format-score";
import { buildPostExcerpt } from "@/lib/posts/excerpt";
import type { FeedArticleItem } from "@/lib/feed/types";
import { formatPublishedTime, getAuthorLabel } from "@/lib/posts/feed-item";

export { getAuthorLabel, formatPublishedTime };

type DraftRecord = {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
  prompt: { title: string } | null;
};

/** 将 Draft 转为 Feed 卡片数据结构。 */
export function mapDraftToFeedItem(
  draft: DraftRecord,
  authorLabel: string
): FeedArticleItem {
  return {
    id: draft.id,
    author: authorLabel,
    time: formatPublishedTime(draft.updatedAt),
    title: draft.title || "无标题草稿",
    excerpt: buildPostExcerpt(draft.content),
    score: DEFAULT_FEED_SCORE,
    views: 0,
    likes: 0,
    href: `/editor?draftId=${draft.id}`,
    singleLineExcerpt: true,
  };
}
