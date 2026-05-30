import { ChannelFeedHeader } from "@/components/layout/channel-feed-header";
import { ContentPanel } from "@/components/layout/content-panel";
import { FeedSortNav } from "@/components/layout/feed-sort-nav";
import type { FeedChannelParam } from "@/lib/feed/params";

type FeedPanelProps = {
  children: React.ReactNode;
  channel?: FeedChannelParam;
};

/** 首页 Feed 大卡片：默认顶部为排序 Tab，热点/爆文频道展示专属 Header。 */
export function FeedPanel({ children, channel = null }: FeedPanelProps) {
  const header =
    channel === "hot" || channel === "viral" ? (
      <ChannelFeedHeader channel={channel} />
    ) : (
      <FeedSortNav />
    );

  return (
    <ContentPanel header={header} suspenseHeader={channel == null}>
      {children}
    </ContentPanel>
  );
}
