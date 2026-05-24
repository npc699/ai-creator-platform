import { HomeSidebar } from "@/components/layout/home-sidebar";
import { getCurrentUser } from "@/lib/auth";
import {
  emptyCreatorSidebarStats,
  getCreatorSidebarStats,
} from "@/lib/sidebar/creator-stats";

type FeedPageLayoutProps = {
  children: React.ReactNode;
};

/** 首页 / 已发布等 Feed 类页面的双栏布局，避免切换时主内容区宽度跳动。 */
export async function FeedPageLayout({ children }: FeedPageLayoutProps) {
  const user = await getCurrentUser();
  const stats = user
    ? await getCreatorSidebarStats(user.id)
    : emptyCreatorSidebarStats;

  return (
    <div className="flex min-h-0 flex-1 items-stretch">
      {children}
      <HomeSidebar
        draftCount={stats.draftCount}
        publishedCount={stats.publishedCount}
        totalViews={stats.totalViews}
      />
    </div>
  );
}
