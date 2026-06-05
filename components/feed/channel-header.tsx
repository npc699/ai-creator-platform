import { Flame, TrendingUp } from "lucide-react";

import { PanelSectionHeader } from "@/components/content-panel";
import { CHANNEL_META, type FeedChannel } from "@/lib/feed/params";

type ChannelFeedHeaderProps = {
  channel: FeedChannel;
};

/** 热点/爆文频道页顶部：标题 + 更新说明，替代默认排序 Tab。 */
export function ChannelFeedHeader({ channel }: ChannelFeedHeaderProps) {
  const meta = CHANNEL_META[channel];
  const Icon = channel === "hot" ? TrendingUp : Flame;

  return (
    <PanelSectionHeader
      icon={Icon}
      iconTone={meta.iconTone}
      subtitle={meta.subtitle}
      title={meta.title}
    />
  );
}
