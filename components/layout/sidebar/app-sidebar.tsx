"use client";

import { Sparkles } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { SidebarMainNav } from "./sidebar-main-nav";
import { sidebarCreationNav, sidebarToolNav } from "./sidebar-nav-config";
import { SidebarNavSection } from "./sidebar-nav-section";
import { bgBrandSurface, borderBrandSoft } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <aside className="hidden w-56 shrink-0 lg:block xl:w-60">
      <div className="sticky top-20 z-10">
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <div className="space-y-6">
            <SidebarMainNav pathname={pathname} searchParams={searchParams} />
            <SidebarNavSection
              items={sidebarCreationNav}
              pathname={pathname}
              searchParams={searchParams}
              title="我的创作"
            />
            <SidebarNavSection
              items={sidebarToolNav}
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
