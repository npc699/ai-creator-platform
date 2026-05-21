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
import { usePathname } from "next/navigation";

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

const mainNav: NavItem[] = [
  { label: "首页", href: "/", icon: Home },
  { label: "热点榜单", href: "/?tab=hot", icon: TrendingUp },
  { label: "爆文榜单", href: "/?tab=viral", icon: Flame },
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

function NavSection({
  title,
  items,
  pathname,
}: {
  title?: string;
  items: NavItem[];
  pathname: string;
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
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href.split("?")[0]);

        return (
          <Link
            key={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              isActive ? navSidebarActive : navSidebarIdle
            )}
            href={item.href}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                isActive ? "text-brand-primary" : "text-zinc-900"
              )}
            />
            <span
              className={cn(isActive ? "text-brand-primary" : "text-zinc-900")}
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

  return (
    <aside className="hidden w-56 shrink-0 border-r border-zinc-200/80 bg-white lg:block xl:w-60">
      <div className="sticky top-16 space-y-6 p-4">
        <NavSection items={mainNav} pathname={pathname} />
        <NavSection items={creationNav} pathname={pathname} title="我的创作" />
        <NavSection items={toolNav} pathname={pathname} title="工具" />

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
    </aside>
  );
}
