"use client";

import { Eye, Heart } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  buildHomeQuery,
  FEED_SORT_OPTIONS,
  parseFeedChannel,
  parseFeedSort,
} from "@/lib/feed/params";
import { cn } from "@/lib/utils";

function feedSortTabClass(isActive: boolean) {
  return cn(
    "group relative inline-flex h-10 items-center justify-center px-4 text-sm transition-colors duration-200 ease-out",
    isActive ? "font-semibold" : "font-medium"
  );
}

function feedSortLabelClass(isActive: boolean) {
  return cn(
    "transition-colors duration-200 ease-out",
    isActive
      ? "text-brand-primary"
      : "text-zinc-900 group-hover:text-brand-primary"
  );
}

function feedSortIndicatorClass(isActive: boolean) {
  return cn(
    "absolute bottom-0 left-1/2 h-[3px] w-8 origin-center -translate-x-1/2 rounded-full bg-brand-primary transition-transform duration-300 ease-out",
    isActive ? "scale-x-100" : "scale-x-0"
  );
}

type FeedItem = {
  id: string;
  author: string;
  time: string;
  title: string;
  excerpt: string;
  tags: string[];
  views: string;
  likes: string;
};

const baseFeedItems: FeedItem[] = [
  {
    id: "1",
    author: "科技观察员",
    time: "2 小时前",
    title: "2026 年 AI 写作工具横评：从效率到质量的 5 个维度",
    excerpt:
      "我们测试了 12 款主流 AI 写作产品，从生成速度、可控性、事实准确率和排版体验四个维度给出结论……",
    tags: ["AI 工具", "质量 92 分"],
    views: "12.4k",
    likes: "834",
  },
  {
    id: "2",
    author: "运营研究社",
    time: "4 小时前",
    title: "短视频脚本 3 段式结构：开头 3 秒决定完播率",
    excerpt:
      "结合 200 条爆款样本，我们总结出「痛点 - 反转 - 行动」结构，并给出可直接套用的模板……",
    tags: ["短视频", "脚本"],
    views: "9.8k",
    likes: "612",
  },
  {
    id: "3",
    author: "内容增长笔记",
    time: "昨天",
    title: "公众号标题 21 种公式：点击率提升 37% 的实测",
    excerpt:
      "通过 A/B 测试对比数字型、悬念型、对比型标题，整理出适合不同赛道的标题写法与避坑清单……",
    tags: ["公众号", "标题"],
    views: "15.1k",
    likes: "1.1k",
  },
];

// 测试滚动布局用的占位数据，联调完成后由 channel + sort 驱动接口请求
const feedItems: FeedItem[] = [
  ...baseFeedItems,
  ...Array.from({ length: 15 }, (_, index) => {
    const template = baseFeedItems[index % baseFeedItems.length]!;
    const seq = index + 4;

    return {
      ...template,
      id: `scroll-mock-${seq}`,
      time: `${seq} 小时前`,
      title: `[滚动测试 #${seq}] ${template.title}`,
      views: `${(seq * 1.3).toFixed(1)}k`,
      likes: String(seq * 127),
    };
  }),
];

export function HomeFeed() {
  const searchParams = useSearchParams();
  const channel = parseFeedChannel(searchParams.get("channel"));
  const sort = parseFeedSort(searchParams.get("sort"));

  return (
    <section className="min-w-0 flex-1">
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-200/80 px-4 py-3">
          <nav
            aria-label="内容筛选"
            className="flex flex-wrap items-center gap-6"
          >
            {FEED_SORT_OPTIONS.map(({ sort: sortKey, label }) => {
              const isActive = sort === sortKey;

              return (
                <Link
                  key={sortKey}
                  aria-current={isActive ? "page" : undefined}
                  className={feedSortTabClass(isActive)}
                  href={buildHomeQuery({ channel, sort: sortKey })}
                >
                  <span className={feedSortLabelClass(isActive)}>{label}</span>
                  <span
                    aria-hidden
                    className={feedSortIndicatorClass(isActive)}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4 p-4">
          {feedItems.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600">
                  {item.author.slice(0, 1)}
                </span>
                <div>
                  <p className="text-sm font-medium text-zinc-900">{item.author}</p>
                  <p className="text-xs text-zinc-500">{item.time}</p>
                </div>
              </div>

              <h3 className="mt-4 text-lg font-semibold leading-7 text-zinc-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{item.excerpt}</p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {item.views}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {item.likes}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
