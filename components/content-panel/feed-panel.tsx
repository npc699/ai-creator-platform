import { ChannelFeedHeader } from "@/components/feed";
import { FeedSortNav } from "@/components/feed";
import type { FeedChannelParam } from "@/lib/feed/params";

import { ContentPanel } from "./content-panel";

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
