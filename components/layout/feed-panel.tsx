import { ContentPanel } from "@/components/layout/content-panel";
import { FeedSortNav } from "@/components/layout/feed-sort-nav";

type FeedPanelProps = {
  children: React.ReactNode;
};

/** 首页 Feed 大卡片：顶部为内容排序 Tab。 */
export function FeedPanel({ children }: FeedPanelProps) {
  return (
    <ContentPanel header={<FeedSortNav />} suspenseHeader>
      {children}
    </ContentPanel>
  );
}
