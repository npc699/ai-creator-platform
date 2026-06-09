import type { HotSidebarRankItem } from "@/lib/feed/sidebar-ranking";
import type { Role } from "@/lib/generated/prisma/client";

export type DashboardUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: string | null;
  role?: Role;
};

/** 右侧 DashboardRail 数据，由 (main)/layout.tsx 拉取后传入。 */
export type DashboardSidebarData = {
  draftCount: number;
  publishedCount: number;
  totalViews: string;
  hotRanking: HotSidebarRankItem[];
};

export type DashboardRailProps = DashboardSidebarData;
