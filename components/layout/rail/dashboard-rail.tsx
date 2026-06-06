import { CreatorStatsPanel } from "./creator-stats-panel";
import { HotRankingPanel } from "./hot-ranking-panel";
import type { DashboardRailProps } from "@/components/layout/types";

export function DashboardRail({
  publishedCount = 0,
  draftCount = 0,
  totalViews = "0",
  hotRanking = [],
}: Partial<DashboardRailProps>) {
  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-20 z-10 space-y-4 px-4 pb-4">
        <CreatorStatsPanel
          draftCount={draftCount}
          publishedCount={publishedCount}
          totalViews={totalViews}
        />
        <HotRankingPanel hotRanking={hotRanking} />
      </div>
    </aside>
  );
}
