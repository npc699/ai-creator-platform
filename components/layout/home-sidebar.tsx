import Link from "next/link";

import { StartCreateLink } from "@/components/layout/start-create-link";
import { buildHomeQuery } from "@/lib/feed/params";
import { cn } from "@/lib/utils";

function getHotTopicRankClass(rank: number) {
  switch (rank) {
    case 1:
      return "bg-red-500 text-white";
    case 2:
      return "bg-orange-400 text-white";
    case 3:
      return "bg-amber-400 text-white";
    default:
      return "bg-zinc-100 text-zinc-500";
  }
}

const hotTopics = [
  {
    rank: 1,
    id: "ai-writing-tools",
    title: "AI 写作工具横评",
    count: "24.1万讨论",
  },
  {
    rank: 2,
    id: "short-video-script",
    title: "短视频脚本结构",
    count: "18.6万讨论",
  },
  {
    rank: 3,
    id: "wechat-title-formulas",
    title: "公众号标题公式",
    count: "15.2万讨论",
  },
  {
    rank: 4,
    id: "content-monetization",
    title: "内容变现路径",
    count: "12.8万讨论",
  },
  {
    rank: 5,
    id: "growth-30d-review",
    title: "起号 30 天复盘",
    count: "9.7万讨论",
  },
] as const;

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
      <div className="sticky top-20 z-10 space-y-4 px-4 pb-4">
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <StartCreateLink />

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-zinc-100 px-2 py-3">
              <p className="text-lg font-semibold text-zinc-900">{publishedCount}</p>
              <p className="mt-1 text-xs text-zinc-900">已发布</p>
            </div>
            <div className="rounded-xl bg-zinc-100 px-2 py-3">
              <p className="text-lg font-semibold text-zinc-900">{draftCount}</p>
              <p className="mt-1 text-xs text-zinc-900">草稿</p>
            </div>
            <div className="rounded-xl bg-zinc-100 px-2 py-3">
              <p className="text-lg font-semibold text-zinc-900">{totalViews}</p>
              <p className="mt-1 text-xs text-zinc-900">总阅读</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">热点话题</h2>
          <ol className="mt-4 space-y-1">
            {hotTopics.map((topic) => (
              <li key={topic.id}>
                <Link
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-100"
                  href={buildHomeQuery({ channel: "hot", topic: topic.id })}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold leading-none",
                      getHotTopicRankClass(topic.rank)
                    )}
                  >
                    {topic.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium leading-5 text-zinc-800">
                      {topic.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-4 text-zinc-500">
                      {topic.count}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          <Link
            className="mt-3 block w-full rounded-lg py-2 text-center text-sm font-medium text-brand-primary! transition hover:bg-zinc-50 hover:text-brand-primary!"
            href={buildHomeQuery({ channel: "hot" })}
          >
            查看更多
          </Link>
        </section>
      </div>
    </aside>
  );
}
