"use client";

import {
  BookOpen,
  FileEdit,
  Flame,
  FolderOpen,
  Home,
  Library,
  PenLine,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import {
  buildEditorHref,
  getCurrentReturnPath,
} from "@/lib/editor/editor-navigation";
import {
  buildHomeQuery,
  parseFeedChannel,
  parseFeedSort,
  type FeedChannelParam,
} from "@/lib/feed/params";
import {
  bgBrandSurface,
  borderBrandSoft,
  navSidebarActive,
  navSidebarIdle,
} from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type MainNavItem = {
  label: string;
  channel: FeedChannelParam;
  icon: React.ComponentType<{ className?: string }>;
};

const mainNavItems: MainNavItem[] = [
  { label: "首页", channel: null, icon: Home },
  { label: "热点榜单", channel: "hot", icon: TrendingUp },
  { label: "爆文榜单", channel: "viral", icon: Flame },
];

const creationNav: NavItem[] = [
  { label: "编辑器", href: "/editor", icon: PenLine },
  { label: "草稿箱", href: "/drafts", icon: FileEdit },
  { label: "已发布", href: "/published", icon: BookOpen },
];

const toolNav: NavItem[] = [
  { label: "Prompt 库", href: "/prompts", icon: Library },
  { label: "素材库", href: "/assets", icon: FolderOpen },
];

function isMainNavActive(
  pathname: string,
  searchParams: URLSearchParams,
  channel: FeedChannelParam
) {
  if (pathname !== "/") return false;
  return parseFeedChannel(searchParams.get("channel")) === channel;
}

function isNavItemActive(
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
    pathname === normalizedPath ||
    pathname.startsWith(`${normalizedPath}/`)
  );
}

function MainNavSection({
  pathname,
  searchParams,
}: {
  pathname: string;
  searchParams: URLSearchParams;
}) {
  const sort = parseFeedSort(searchParams.get("sort"));

  return (
    <div className="space-y-1">
      {mainNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = isMainNavActive(pathname, searchParams, item.channel);
        const href = buildHomeQuery({ channel: item.channel, sort });

        return (
          <Link
            key={item.label}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
              isActive ? navSidebarActive : navSidebarIdle
            )}
            href={href}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors duration-200 ease-out",
                isActive
                  ? "text-brand-primary"
                  : "text-zinc-900 group-hover:text-brand-primary"
              )}
            />
            <span
              className={cn(
                "transition-colors duration-200 ease-out",
                isActive
                  ? "text-brand-primary"
                  : "text-zinc-900 group-hover:text-brand-primary"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function NavSection({
  title,
  items,
  pathname,
  searchParams,
}: {
  title?: string;
  items: NavItem[];
  pathname: string;
  searchParams: URLSearchParams;
}) {
  return (
    <div className="space-y-1">
      {title ? (
        <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
          {title}
        </p>
      ) : null}
      {items.map((item) => {
        const Icon = item.icon;
        const href =
          item.href === "/editor"
            ? buildEditorHref({
                from: getCurrentReturnPath(
                  pathname,
                  searchParams.toString()
                ),
              })
            : item.href;
        const isActive = isNavItemActive(pathname, searchParams, item.href);

        return (
          <Link
            key={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
              isActive ? navSidebarActive : navSidebarIdle
            )}
            href={href}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors duration-200 ease-out",
                isActive
                  ? "text-brand-primary"
                  : "text-zinc-900 group-hover:text-brand-primary"
              )}
            />
            <span
              className={cn(
                "transition-colors duration-200 ease-out",
                isActive
                  ? "text-brand-primary"
                  : "text-zinc-900 group-hover:text-brand-primary"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <aside className="hidden w-56 shrink-0 lg:block xl:w-60">
      <div className="sticky top-20 z-10">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <div className="space-y-6">
            <MainNavSection
              pathname={pathname}
              searchParams={searchParams}
            />
            <NavSection
              items={creationNav}
              pathname={pathname}
              searchParams={searchParams}
              title="我的创作"
            />
            <NavSection
              items={toolNav}
              pathname={pathname}
              searchParams={searchParams}
              title="工具"
            />

            <div
              className={cn(
                "rounded-2xl border p-4",
                borderBrandSoft,
                bgBrandSurface
              )}
            >
              <div className="mb-2 flex items-center gap-2 text-brand-on-surface">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">创作助手</span>
              </div>
              <p className="text-xs leading-5 text-brand-muted">
                编辑器、草稿与发布能力将在后续迭代中逐步开放。
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
