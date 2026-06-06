"use client";

import Link from "next/link";

import {
  isSidebarNavItemActive,
  type SidebarNavItem,
} from "./sidebar-nav-config";
import {
  buildEditorHref,
  getCurrentReturnPath,
} from "@/lib/editor/navigation";
import { navSidebarActive, navSidebarIdle } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type SidebarNavSectionProps = {
  title?: string;
  items: SidebarNavItem[];
  pathname: string;
  searchParams: URLSearchParams;
};

export function SidebarNavSection({
  title,
  items,
  pathname,
  searchParams,
}: SidebarNavSectionProps) {
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
                from: getCurrentReturnPath(pathname, searchParams.toString()),
              })
            : item.href;
        const isActive = isSidebarNavItemActive(
          pathname,
          searchParams,
          item.href
        );

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
