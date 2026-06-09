"use client";

import Link from "next/link";

import {
  isSidebarMainNavActive,
  sidebarMainNavItems,
} from "./sidebar-nav-config";
import { buildHomeQuery, parseFeedSort } from "@/lib/feed/params";
import { navSidebarActive, navSidebarIdle } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type SidebarMainNavProps = {
  pathname: string;
  searchParams: URLSearchParams;
};

export function SidebarMainNav({
  pathname,
  searchParams,
}: SidebarMainNavProps) {
  const sort = parseFeedSort(searchParams.get("sort"));

  return (
    <div className="space-y-1">
      {sidebarMainNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = isSidebarMainNavActive(
          pathname,
          searchParams,
          item.channel
        );
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
