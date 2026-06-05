import { Search } from "lucide-react";

import { UserMenu } from "./user-menu";
import { headerBadge } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  userId: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  isAdmin?: boolean;
};

export function AppHeader({
  userId,
  displayName,
  email,
  phone,
  isAdmin,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/95 backdrop-blur-sm">
      <div className="relative flex h-16 items-center gap-4 px-4 lg:px-6">
        <div className="relative z-10 flex min-w-0 shrink-0 items-center gap-2">
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

        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-full max-w-xl -translate-x-1/2 items-center px-4 md:flex">
          <label className="pointer-events-auto relative block w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-100"
              placeholder="搜索内容或创作者"
              type="search"
            />
          </label>
        </div>

        <div className="relative z-10 ml-auto flex shrink-0 items-center">
          <UserMenu
            displayName={displayName}
            email={email}
            isAdmin={isAdmin}
            phone={phone}
            userId={userId}
          />
        </div>
      </div>
    </header>
  );
}
