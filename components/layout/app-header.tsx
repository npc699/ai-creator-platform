import { Bell, Search } from "lucide-react";

import { UserMenu } from "@/components/layout/user-menu";
import {
  bgBrandSurface,
  borderBrandSoft,
  headerBadge,
  btnSoft,
} from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  displayName: string;
  subtitle?: string | null;
  isAdmin?: boolean;
};

export function AppHeader({ displayName, subtitle, isAdmin }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold",
              headerBadge
            )}
          >
            创
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            创作台
          </span>
        </div>

        <div className="mx-auto hidden w-full max-w-xl md:block">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              className={cn(
                "w-full rounded-full border py-2 pl-10 pr-4 text-sm text-brand-on-surface outline-none transition",
                borderBrandSoft,
                bgBrandSurface,
                "placeholder:text-brand-muted/70 focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-surface"
              )}
              placeholder="搜索内容或创作者"
              type="search"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            aria-label="通知"
            className={cn(btnSoft, "rounded-full border p-2", borderBrandSoft)}
            type="button"
          >
            <Bell className="h-4 w-4" />
          </button>
          <UserMenu
            displayName={displayName}
            isAdmin={isAdmin}
            subtitle={subtitle}
          />
        </div>
      </div>
    </header>
  );
}
