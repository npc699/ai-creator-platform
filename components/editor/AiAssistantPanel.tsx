"use client";

import { useState, type KeyboardEvent } from "react";

import { Bot, Sparkles, Square } from "lucide-react";

import { useEditorContext } from "@/components/editor/editor-context";
import { cn } from "@/lib/utils";
import type { AiGenerateMode } from "@/lib/ai/schema";

type QuickAction = {
  label: string;
  mode?: AiGenerateMode;
  action?: "review";
  disabled?: boolean;
  title?: string;
};

const quickActions: QuickAction[] = [
  { label: "润色当前段落", mode: "polish" },
  { label: "扩写选中内容", mode: "expand" },
  { label: "精简压缩", mode: "shrink" },
  {
    label: "文章预审核与评分",
    action: "review",
    title: "对当前标题和正文进行 AI 预审",
  },
];

export function AiAssistantPanel({
  keyword,
  onKeywordChange,
}: {
  keyword: string;
  onKeywordChange: (value: string) => void;
}) {
  const {
    editor,
    generationError,
    getEditorContent,
    isGenerating,
    selectedText,
    showNoticeBanner,
    startGenerate,
    stopGenerate,
    tags,
    title,
  } = useEditorContext();
  const [insertMode, setInsertMode] = useState<"replace" | "append">("replace");
  const [isReviewing, setIsReviewing] = useState(false);

  const isEditorReady = Boolean(editor);
  const hasSelection = selectedText.length > 0;
  const showInstructionPlaceholder = keyword.length === 0;

  const handleGenerate = async () => {
    if (isGenerating) {
      stopGenerate();
      return;
    }

    const succeeded = hasSelection
      ? await startGenerate({
          mode: "selection",
          keyword,
          insertMode,
        })
      : await startGenerate({ mode: "generate", keyword });

    if (succeeded) {
      onKeywordChange("");
    }
  };

  const handleQuickAction = async (action: QuickAction) => {
    if (action.disabled || isGenerating || isReviewing) {
      return;
    }

    if (action.action === "review") {
      const trimmedTitle = title.trim();
      const content = getEditorContent();
      const plainText = content.replace(/<[^>]*>/g, "").trim();
      if (!trimmedTitle || !plainText) {
        showNoticeBanner("请先输入标题和正文再审核");
        return;
      }

      setIsReviewing(true);
      try {
        const response = await fetch("/api/review/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmedTitle, content, tags }),
          credentials: "same-origin",
        });
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          reviewResult?: {
            status: "PENDING" | "PASSED" | "REJECTED" | "FLAGGED";
            safety: { reason: string };
            qualityScore: number | null;
          };
        } | null;

        if (!response.ok || !payload?.reviewResult) {
          showNoticeBanner(
            payload?.error ?? "内容审核失败，请稍后重试",
            "error"
          );
          return;
        }

        const { reviewResult } = payload;
        const scoreText =
          reviewResult.qualityScore === null
            ? "质量分待生成"
            : `质量分 ${reviewResult.qualityScore}`;

        if (reviewResult.status === "REJECTED") {
          showNoticeBanner(
            `${reviewResult.safety.reason}，${scoreText}`,
            "error"
          );
          return;
        }

        showNoticeBanner(`${reviewResult.safety.reason}，${scoreText}`);
      } catch {
        showNoticeBanner("内容审核失败，请稍后重试", "error");
      } finally {
        setIsReviewing(false);
      }
      return;
    }

    if (action.mode) {
      void startGenerate({
        mode: action.mode,
        insertMode,
      });
    }
  };

  const handleKeywordKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();

    if (!isEditorReady && !isGenerating) {
      return;
    }

    void handleGenerate();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-[#fdfcf8] p-4 transition-opacity duration-200">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Sparkles className="h-4 w-4 text-brand-primary" />
          生成设置
        </div>

        <label className="block text-xs font-medium text-zinc-500">
          写作指令
          <div className="relative mt-2">
            {showInstructionPlaceholder ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-3 top-2.5 text-sm leading-6 text-zinc-400"
              >
                {hasSelection
                  ? "例：把选中内容改得更口语化，并补充一个生活化例子..."
                  : "例：写一篇约 800 字的专业测评，对比 AI 写作工具的效率与适用场景，语气偏严谨..."}
              </span>
            ) : null}
            <textarea
              className="min-h-32 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm leading-6 text-zinc-800 outline-none transition focus:border-brand-border focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isGenerating}
              onChange={(event) => onKeywordChange(event.target.value)}
              onKeyDown={handleKeywordKeyDown}
              value={keyword}
            />
          </div>
        </label>

        <div
          aria-hidden={!hasSelection}
          className={cn(
            "overflow-hidden transition-all duration-200 ease-out",
            hasSelection
              ? "mt-3 max-h-32 opacity-100"
              : "mt-0 max-h-0 opacity-0"
          )}
        >
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5">
            <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
              <span>
                已选中 {selectedText.length} 字，可按写作指令处理这段内容
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { label: "替换", value: "replace" as const },
                { label: "追加", value: "append" as const },
              ].map((item) => {
                const isActive = insertMode === item.value;

                return (
                  <button
                    aria-pressed={isActive}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition",
                      isActive
                        ? "border-zinc-300 bg-zinc-100 text-zinc-900"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    )}
                    disabled={isGenerating}
                    key={item.value}
                    onClick={() => setInsertMode(item.value)}
                    onPointerDown={(event) => {
                      // 切换处理方式时保留 TipTap 选区快照。
                      event.preventDefault();
                    }}
                    type="button"
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {generationError ? (
          <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-600">
            {generationError}
          </p>
        ) : null}

        <button
          className={cn(
            "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
            isGenerating
              ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50",
            !isEditorReady && !isGenerating
              ? "cursor-not-allowed opacity-60"
              : null
          )}
          disabled={!isEditorReady && !isGenerating}
          onClick={handleGenerate}
          onPointerDown={(event) => {
            // 保留编辑器光标位置，确保生成内容插入到用户刚才停留的位置。
            event.preventDefault();
          }}
          type="button"
        >
          {isGenerating ? (
            <>
              <Square className="h-4 w-4" />
              停止生成
            </>
          ) : (
            <>
              <Bot className="h-4 w-4" />
              {hasSelection ? "按要求处理选中文本" : "开始生成"}
            </>
          )}
        </button>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-zinc-500">快捷操作</h2>
        <div className="space-y-2">
          {quickActions.map((action) => {
            const disabled =
              action.disabled ||
              !isEditorReady ||
              isReviewing ||
              (isGenerating && !action.disabled);

            return (
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm text-zinc-700 transition",
                  disabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-zinc-50"
                )}
                disabled={disabled}
                key={action.label}
                onClick={() => void handleQuickAction(action)}
                onPointerDown={(event) => {
                  // 快捷操作依赖 TipTap 当前选区，点击侧栏按钮时不抢走选区。
                  event.preventDefault();
                }}
                title={action.title}
                type="button"
              >
                <Sparkles className="h-4 w-4 text-zinc-400" />
                {action.action === "review" && isReviewing
                  ? "审核中…"
                  : action.label}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-5 text-zinc-400">
          润色、扩写和精简会使用当前选中内容，并遵循上方的替换 /
          追加设置；未选中时会提示选择文本。
        </p>
      </section>
    </div>
  );
}
