import { Plus } from "lucide-react";
import Link from "next/link";

import { btnSoft, surfaceSoft, textSoftMuted } from "@/lib/utils/brand";

const hotTopics = [
  { rank: 1, title: "AI 写作工具横评", count: "24.1万讨论" },
  { rank: 2, title: "短视频脚本结构", count: "18.6万讨论" },
  { rank: 3, title: "公众号标题公式", count: "15.2万讨论" },
  { rank: 4, title: "内容变现路径", count: "12.8万讨论" },
  { rank: 5, title: "起号 30 天复盘", count: "9.7万讨论" },
];

type HomeSidebarProps = {
  publishedCount?: number;
  draftCount?: number;
  totalViews?: string;
};

export function HomeSidebar({
  publishedCount = 0,
  draftCount = 0,
  totalViews = "0",
}: HomeSidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-20 space-y-4 p-4">
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <Link
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${btnSoft}`}
            href="/editor"
          >
            <Plus className="h-4 w-4" />
            开始创作
          </Link>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className={`rounded-xl px-2 py-3 ${surfaceSoft}`}>
              <p className="text-lg font-semibold">{publishedCount}</p>
              <p className={`mt-1 text-xs ${textSoftMuted}`}>已发布</p>
            </div>
            <div className={`rounded-xl px-2 py-3 ${surfaceSoft}`}>
              <p className="text-lg font-semibold">{draftCount}</p>
              <p className={`mt-1 text-xs ${textSoftMuted}`}>草稿</p>
            </div>
            <div className={`rounded-xl px-2 py-3 ${surfaceSoft}`}>
              <p className="text-lg font-semibold">{totalViews}</p>
              <p className={`mt-1 text-xs ${textSoftMuted}`}>总阅读</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">热点话题</h2>
          <ol className="mt-4 space-y-3">
            {hotTopics.map((topic) => (
              <li key={topic.rank} className="flex gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${surfaceSoft}`}
                >
                  {topic.rank}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-800">
                    {topic.title}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">{topic.count}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </aside>
  );
}
