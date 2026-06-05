// 主应用全站骨架：(main) layout 挂载；含 Session、顶栏、左导航与固定右栏 HomeSidebar。
// sidebar 数据由 (main)/layout.tsx 拉取后传入，避免各 page 重复请求。
import { AppHeader } from "./header";
import { AppSidebar } from "./sidebar";
import { HomeSidebar } from "./home-sidebar";
import { ScrollToTopButton } from "./scroll-top";
import { SessionProvider } from "next-auth/react";
import type { HotSidebarRankItem } from "@/lib/feed/hot-sidebar-ranking";
import { Role } from "@/lib/generated/prisma/client";

export type DashboardUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: string | null;
  role?: Role;
};

export type DashboardSidebarData = {
  draftCount: number;
  publishedCount: number;
  totalViews: string;
  hotRanking: HotSidebarRankItem[];
};

type DashboardShellProps = {
  user: DashboardUser;
  sidebar: DashboardSidebarData;
  children: React.ReactNode;
};

// 供 AppHeader / UserMenu 展示；与 Credentials 登录字段优先级一致。
function getDisplayName(user: DashboardUser) {
  return user.name ?? user.email ?? user.phone ?? "创作者";
}

/** (main) 路由组外壳；SessionProvider 仅包工作台，登录页不挂载以减轻 client bundle。 */
export function DashboardShell({
  user,
  sidebar,
  children,
}: DashboardShellProps) {
  const displayName = getDisplayName(user);
  // 控制顶栏管理入口等 ADMIN 专属 UI。
  const isAdmin = user.role === Role.ADMIN;
  return (
    <SessionProvider>
      <div className="flex min-h-screen flex-col bg-brand-surface/30">
        <AppHeader
          displayName={displayName}
          email={user.email}
          isAdmin={isAdmin}
          phone={user.phone}
          userId={user.id}
        />
        {/* max-w + min-h-0：限制内容宽度，并让 flex 子项在视口内正确滚动。 */}
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 min-h-0 items-stretch gap-4 px-4 pb-6 pt-4 lg:px-6">
          <AppSidebar />
          {/* 主内容与 HomeSidebar 同层 flex，切换 (main) 路由时主栏宽度不跳动。 */}
          <div className="flex min-h-0 min-w-0 flex-1 items-stretch">
            {" "}
            {children}
            <HomeSidebar
              draftCount={sidebar.draftCount}
              hotRanking={sidebar.hotRanking}
              publishedCount={sidebar.publishedCount}
              totalViews={sidebar.totalViews}
            />
          </div>
        </div>
        <ScrollToTopButton />
      </div>
    </SessionProvider>
  );
}
