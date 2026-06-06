// (main) 路由组 layout：鉴权、拉取右栏数据并挂载 DashboardShell；本组下所有 page 共用同一套双栏骨架。
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout";
import { getCurrentUser } from "@/lib/auth";
import { fetchHotSidebarRanking } from "@/lib/feed/sidebar-ranking";
import { getCreatorSidebarStats } from "@/lib/users";

/** 工作台外壳；未登录 redirect 与 proxy 形成双重校验。 */
export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  // 与 proxy 双重校验，避免无会话时渲染主应用布局。
  if (!user) {
    redirect("/login");
  }

  // 右栏统计与热榜在此统一拉取，避免各 page 重复请求（原 FeedPageLayout 职责）。
  const [sidebarStats, hotRanking] = await Promise.all([
    getCreatorSidebarStats(user.id),
    fetchHotSidebarRanking(),
  ]);

  return (
    <DashboardShell
      sidebar={{
        draftCount: sidebarStats.draftCount,
        hotRanking,
        publishedCount: sidebarStats.publishedCount,
        totalViews: sidebarStats.totalViews,
      }}
      user={user}
    >
      {children}
    </DashboardShell>
  );
}
