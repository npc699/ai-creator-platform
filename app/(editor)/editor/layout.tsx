"use client";

import { useState, type ReactNode } from "react";

import {
  Bot,
  ChevronLeft,
  ImageIcon,
  Library,
  Save,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { btnSoftActive } from "@/lib/utils/brand";

type EditorLayoutProps = {
  children: ReactNode;
};

const assistantTabs = [
  { label: "AI 生成", icon: Bot },
  { label: "Prompt 库", icon: Library },
  { label: "素材库", icon: ImageIcon },
] as const;

const quickActions = ["润色当前段落", "扩写选中内容", "精简压缩", "内容审核"];
// 右侧辅助面板先用静态数据承载交互，后续接 Prompt / 素材接口后替换为真实列表。
const promptTemplates = ["产品测评文章", "小红书种草文", "行业趋势分析"];
const assetItems = ["封面图", "产品截图", "数据图表"];

type AssistantTab = (typeof assistantTabs)[number]["label"];

export default function EditorLayout({ children }: EditorLayoutProps) {
  // 右侧面板保持在布局层，保证 /editor/[id] 二次编辑后仍复用同一套辅助区。
  const [activeAssistantTab, setActiveAssistantTab] =
    useState<AssistantTab>("AI 生成");

  return (
    <div className="min-h-screen bg-white">
      <header className="flex flex-col gap-5 border-b border-zinc-200/80 bg-white p-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Link
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
            href="/"
          >
            <ChevronLeft className="h-4 w-4" />
            返回
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-6 lg:justify-end">
          <div className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            已自动保存
          </div>
          <button
            className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium hover:bg-brand-surface hover:ring-2 hover:ring-brand-border ${btnSoftActive}`}
            type="button"
          >
            <Save className="h-4 w-4" />
            预览
          </button>
          <button
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-400 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-500"
            type="button"
          >
            <Sparkles className="h-4 w-4" />
            发布
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4.25rem)] grid-cols-1 bg-zinc-50/60 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="min-w-0 bg-[#fdfcf8]">{children}</main>

        <aside className="border-t border-zinc-200/80 bg-white lg:border-l lg:border-t-0">
          <div className="grid h-[61px] grid-cols-3 border-b border-zinc-200/80">
            {assistantTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeAssistantTab === tab.label;

              return (
                <button
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex h-full items-center justify-center gap-2 border-b-2 px-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "border-b-2 border-brand-primary text-brand-primary"
                      : "border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950"
                  )}
                  key={tab.label}
                  onClick={() => setActiveAssistantTab(tab.label)}
                  type="button"
                >
                  <Icon className="hidden h-4 w-4 xl:block" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-5">
            {activeAssistantTab === "AI 生成" ? (
              <div className="space-y-5">
                <section className="rounded-2xl bg-[#fdfcf8] p-4 transition-opacity duration-200">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                    <Sparkles className="h-4 w-4 text-brand-primary" />
                    生成设置
                  </div>

                  <label className="block text-xs font-medium text-zinc-500">
                    关键词 / 写作方向
                    <textarea
                      className="mt-2 min-h-28 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm leading-6 text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-brand-border focus:ring-2 focus:ring-white"
                      placeholder="例：AI 写作工具对比，突出效率提升和适用场景..."
                    />
                  </label>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-zinc-500">
                      写作风格
                      <select className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none">
                        <option>专业严谨</option>
                        <option>轻松科普</option>
                        <option>营销转化</option>
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-zinc-500">
                      字数
                      <select className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none">
                        <option>800字</option>
                        <option>1200字</option>
                        <option>2000字</option>
                      </select>
                    </label>
                  </div>

                  <button
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                    type="button"
                  >
                    <Bot className="h-4 w-4" />
                    开始生成
                  </button>
                </section>

                <section>
                  <h2 className="mb-3 text-sm font-medium text-zinc-500">
                    快捷操作
                  </h2>
                  <div className="space-y-2">
                    {quickActions.map((action) => (
                      <button
                        className="flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                        key={action}
                        type="button"
                      >
                        <Sparkles className="h-4 w-4 text-zinc-400" />
                        {action}
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            ) : null}

            {activeAssistantTab === "Prompt 库" ? (
              <section className="space-y-3 transition-opacity duration-200">
                <h2 className="text-sm font-medium text-zinc-500">
                  常用 Prompt 模板
                </h2>
                {promptTemplates.map((template) => (
                  <button
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                    key={template}
                    type="button"
                  >
                    {template}
                  </button>
                ))}
              </section>
            ) : null}

            {activeAssistantTab === "素材库" ? (
              <section className="space-y-3 transition-opacity duration-200">
                <h2 className="text-sm font-medium text-zinc-500">素材库</h2>
                <button
                  className="flex h-28 w-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-[#fdfcf8] text-sm font-medium text-zinc-500 transition hover:bg-zinc-50"
                  type="button"
                >
                  上传或选择图片素材
                </button>
                {assetItems.map((asset) => (
                  <button
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                    key={asset}
                    type="button"
                  >
                    {asset}
                  </button>
                ))}
              </section>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
