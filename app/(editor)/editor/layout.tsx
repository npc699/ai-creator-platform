"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  Bot,
  ChevronLeft,
  ImageIcon,
  Library,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";

import { AiAssistantPanel } from "@/components/editor/AiAssistantPanel";
import { AssistantTabPanel } from "@/components/editor/assistant-tab-panel";
import { AssetLibraryPanel } from "@/components/editor/AssetLibraryPanel";
import {
  EditorProvider,
  useEditorContext,
} from "@/components/editor/editor-context";
import { cn } from "@/lib/utils";
import { btnPrimary, btnSoftActive } from "@/lib/utils/brand";

// 主动保存：与 30s 自动保存共用同一套 runSave，避免双写逻辑分叉。
function EditorManualSaveButton() {
  const { saveDraft, saveStatus, showNoticeBanner, isUploadingImage } = useEditorContext();
  const isSaving = saveStatus === "saving";
  const isBusy = isSaving || isUploadingImage;

  const handleSave = useCallback(async () => {
    const result = await saveDraft();
    if (!result.ok) {
      return;
    }
    showNoticeBanner(result.skipped ? "内容已是最新" : "保存成功");
  }, [saveDraft, showNoticeBanner]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  return (
    <button
      className={cn(
        `inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium ${btnSoftActive}`,
        isBusy && "pointer-events-none opacity-60"
      )}
      disabled={isBusy}
      onClick={() => void handleSave()}
      type="button"
    >
      <Save className="h-4 w-4" />
      {isUploadingImage ? "图片上传中…" : isSaving ? "保存中…" : "保存"}
    </button>
  );
}

// 顶部"已自动保存 / 保存中 / 保存失败"指示器：唯一真实数据源是 EditorContext.saveStatus。
function EditorSaveStatusIndicator() {
  const { saveStatus, lastSavedAt } = useEditorContext();

  const dotClass =
    saveStatus === "saving"
      ? "bg-amber-500"
      : saveStatus === "saved"
        ? "bg-emerald-500"
        : saveStatus === "error"
          ? "bg-red-500"
          : "bg-zinc-300";

  let label = "草稿未保存";
  if (saveStatus === "saving") {
    label = "保存中…";
  } else if (saveStatus === "saved") {
    label = lastSavedAt
      ? `已自动保存 · ${lastSavedAt.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : "已自动保存";
  } else if (saveStatus === "error") {
    label = "保存失败，重试中…";
  }

  return (
    <div className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-zinc-500">
      <span className={cn("h-2 w-2 rounded-full", dotClass)} />
      {label}
    </div>
  );
}

// 顶部绿色提示条：恢复草稿、内容已是最新等场景共用；3 秒后或用户编辑正文后自动收起。
function EditorNoticeBanner() {
  const { noticeBanner, dismissNoticeBanner } = useEditorContext();

  useEffect(() => {
    if (!noticeBanner) {
      return;
    }
    const timer = window.setTimeout(() => {
      dismissNoticeBanner();
    }, 3000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [dismissNoticeBanner, noticeBanner]);

  if (!noticeBanner) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50/70 px-5 py-2 text-sm text-emerald-700"
    >
      <span>{noticeBanner}</span>
      <button
        aria-label="关闭提示"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-emerald-600 transition hover:bg-emerald-100"
        onClick={dismissNoticeBanner}
        type="button"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

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

        <div className="flex flex-wrap items-center gap-3 lg:justify-end lg:gap-4">
          <EditorSaveStatusIndicator />
          <EditorManualSaveButton />
          <button
            className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium hover:bg-brand-surface hover:ring-2 hover:ring-brand-border ${btnSoftActive}`}
            type="button"
          >
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
        <EditorNoticeBanner />

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
