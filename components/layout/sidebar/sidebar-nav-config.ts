import {
  BookOpen,
  FileEdit,
  Flame,
  FolderOpen,
  Home,
  Library,
  PenLine,
  TrendingUp,
} from "lucide-react";
import type { ComponentType } from "react";

import { parseFeedChannel, type FeedChannelParam } from "@/lib/feed/params";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

export type SidebarMainNavItem = {
  label: string;
  channel: FeedChannelParam;
  icon: ComponentType<{ className?: string }>;
};

export const sidebarMainNavItems: SidebarMainNavItem[] = [
  { label: "首页", channel: null, icon: Home },
  { label: "热点榜单", channel: "hot", icon: TrendingUp },
  { label: "爆文榜单", channel: "viral", icon: Flame },
];

export const sidebarCreationNav: SidebarNavItem[] = [
  { label: "编辑器", href: "/editor", icon: PenLine },
  { label: "草稿箱", href: "/drafts", icon: FileEdit },
  { label: "已发布", href: "/published", icon: BookOpen },
];

export const sidebarToolNav: SidebarNavItem[] = [
  { label: "Prompt 库", href: "/prompts", icon: Library },
  { label: "素材库", href: "/assets", icon: FolderOpen },
];

export function isSidebarMainNavActive(
  pathname: string,
  searchParams: URLSearchParams,
  channel: FeedChannelParam
) {
  if (pathname !== "/") return false;
  return parseFeedChannel(searchParams.get("channel")) === channel;
}

export function isSidebarNavItemActive(
  pathname: string,
  searchParams: URLSearchParams,
  href: string
) {
  const [path, queryString] = href.split("?");
  const normalizedPath = path || "/";

  if (normalizedPath === "/") {
    if (pathname !== "/") return false;

    const channel = parseFeedChannel(searchParams.get("channel"));
    if (!queryString) {
      return channel === null;
    }

    const hrefChannel = new URLSearchParams(queryString).get("channel");
    return channel === hrefChannel;
  }

  return (
    pathname === normalizedPath || pathname.startsWith(`${normalizedPath}/`)
  );
}
