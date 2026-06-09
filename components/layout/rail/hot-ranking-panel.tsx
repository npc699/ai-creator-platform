import Link from "next/link";

import { buildHomeQuery } from "@/lib/feed/params";
import type { HotSidebarRankItem } from "@/lib/feed/sidebar-ranking";
import { HOT_SIDEBAR_META } from "@/lib/feed/sidebar-ranking";
import { getHotRankBadgeClass } from "@/lib/feed/badges";
import { cn } from "@/lib/utils";

type HotRankingPanelProps = {
  hotRanking: HotSidebarRankItem[];
};

export function HotRankingPanel({ hotRanking }: HotRankingPanelProps) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">{HOT_SIDEBAR_META.title}</h2>

      {hotRanking.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">暂无上榜文章</p>
      ) : (
        <ol className="mt-4 space-y-1">
          {hotRanking.map((item) => (
            <li key={item.postId}>
              <Link
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-100"
                href={item.href}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold leading-none",
                    getHotRankBadgeClass(item.rank)
                  )}
                >
                  {item.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-5 text-zinc-800">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-4 text-zinc-500">
                    {item.metricLabel}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <Link
        className="mt-3 block w-full rounded-lg py-2 text-center text-sm font-medium text-brand-primary! transition hover:bg-zinc-50 hover:text-brand-primary!"
        href={buildHomeQuery({ channel: "hot" })}
      >
        查看更多
      </Link>
    </section>
  );
}
