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

import { AiAssistantPanel } from "@/components/editor/AiAssistantPanel";
import { AssistantTabPanel } from "@/components/editor/assistant-tab-panel";
import { AssetLibraryPanel } from "@/components/editor/AssetLibraryPanel";
import { EditorProvider } from "@/components/editor/editor-context";
import { cn } from "@/lib/utils";
import { btnPrimary, btnSoftActive } from "@/lib/utils/brand";

type EditorLayoutProps = {
  children: ReactNode;
};

const assistantTabs = [
  { label: "AI 生成", icon: Bot },
  { label: "Prompt 库", icon: Library },
  { label: "素材库", icon: ImageIcon },
] as const;

// 右侧辅助面板先用静态数据承载交互，后续接 Prompt 接口后替换为真实列表。
const promptTemplates = ["产品测评文章", "小红书种草文", "行业趋势分析"];

type AssistantTab = (typeof assistantTabs)[number]["label"];

export default function EditorLayout({ children }: EditorLayoutProps) {
  // 右侧面板保持在布局层，保证 /editor/[id] 二次编辑后仍复用同一套辅助区。
  const [activeAssistantTab, setActiveAssistantTab] =
    useState<AssistantTab>("AI 生成");
  const activeAssistantTabIndex = assistantTabs.findIndex(
    (tab) => tab.label === activeAssistantTab
  );

  return (
    <EditorProvider>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <header className="flex shrink-0 flex-col gap-5 border-b border-zinc-200/80 bg-white p-3 lg:flex-row lg:items-center">
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
            className={`h-9 gap-2 px-4 ${btnPrimary}`}
            type="button"
          >
            <Sparkles className="h-4 w-4" />
            发布
          </button>
        </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50/60 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#fdfcf8] lg:min-h-0">
          {children}
        </main>

        <aside className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-zinc-200/80 bg-white lg:min-h-0 lg:flex-none lg:border-l lg:border-t-0">
          <div className="relative grid h-[61px] shrink-0 grid-cols-3 border-b border-zinc-200/80">
            <div
              aria-hidden
              className="absolute bottom-0 left-0 h-0.5 w-1/3 bg-brand-primary transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
              style={{
                transform: `translateX(${Math.max(activeAssistantTabIndex, 0) * 100}%)`,
              }}
            />
            {assistantTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeAssistantTab === tab.label;

              return (
                <button
                  aria-pressed={isActive}
                  className={cn(
                    "relative z-10 inline-flex h-full items-center justify-center gap-2 px-3 text-sm font-medium transition-colors duration-300 ease-out",
                    isActive
                      ? "text-brand-primary"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950"
                  )}
                  key={tab.label}
                  onClick={() => setActiveAssistantTab(tab.label)}
                  type="button"
                >
                  <Icon
                    className={cn(
                      "hidden h-4 w-4 transition-colors duration-300 ease-out xl:block",
                      isActive ? "text-brand-primary" : "text-zinc-400"
                    )}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto scroll-stable p-5">
            <AssistantTabPanel
              activeKey={activeAssistantTab}
              renderPanel={(tab) => {
                if (tab === "AI 生成") {
                  return <AiAssistantPanel />;
                }

                if (tab === "Prompt 库") {
                  return (
                    <section className="space-y-3">
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
                  );
                }

                return <AssetLibraryPanel />;
              }}
            />
          </div>
        </aside>
        </div>
      </div>
    </EditorProvider>
  );
}
