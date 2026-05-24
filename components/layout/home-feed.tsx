"use client";

import { FeedArticleList } from "@/components/layout/feed-article-list";
import { FeedPanel } from "@/components/layout/feed-panel";
import { mockHomeFeedItems } from "@/lib/feed/mock-items";

export function HomeFeed() {
  return (
    <FeedPanel>
      <FeedArticleList items={mockHomeFeedItems} />
    </FeedPanel>
  );
}
