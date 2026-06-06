"use client";

import { Copy, Pencil, Star, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState, type MouseEvent } from "react";

import { toggleEditorPromptFavorite } from "@/lib/client/prompts/api";
import { getPromptCategoryLabel } from "@/lib/prompts/category";
import type { SerializedPrompt } from "@/lib/prompts/serialize";
import { buildPostExcerpt } from "@/lib/posts/excerpt";
import { btnSoft } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type PromptCardProps = {
  prompt: SerializedPrompt;
  onEdit: () => void;
  onCopy: () => void;
  onDeleteRequest?: () => void;
  onFavoriteChange: (prompt: SerializedPrompt) => void;
  /** 编辑器侧栏：详情内提供「使用」填入正文。 */
  onApply?: () => void;
  /** 编辑器侧栏列表：仅展示标题与缩略内容。 */
  compact?: boolean;
};

export function PromptCard({
  prompt,
  onEdit,
  onCopy,
  onDeleteRequest,
  onFavoriteChange,
  onApply,
  compact = false,
}: PromptCardProps) {
  const [pendingFavorite, setPendingFavorite] = useState<boolean | null>(null);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const canFavorite = prompt.isOfficial;
  const canManage = !prompt.isOfficial;
  const isFavorite = pendingFavorite ?? prompt.isFavorite;

  useEffect(() => {
    if (!expanded) {
      return;
    }

    const scrollY = window.scrollY;
    const { style } = document.body;
    const previous = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      width: style.width,
    };

    // 固定 body 位置，避免弹层打开时背景页仍可滚动。
    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.width = "100%";

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      style.overflow = previous.overflow;
      style.position = previous.position;
      style.top = previous.top;
      style.width = previous.width;
      window.scrollTo(0, scrollY);
    };
  }, [expanded]);

  const stopCardClick = useCallback((event: MouseEvent) => {
    event.stopPropagation();
  }, []);

  const openDetail = useCallback(() => {
    setExpanded(true);
  }, []);

  const handleFavoriteClick = useCallback(async () => {
    if (!canFavorite || isTogglingFavorite) {
      return;
    }

    const next = !isFavorite;
    setPendingFavorite(next);
    setIsTogglingFavorite(true);

    try {
      const updated = await toggleEditorPromptFavorite(prompt.id, next);
      onFavoriteChange(updated);
      setPendingFavorite(null);
    } catch {
      setPendingFavorite(null);
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [canFavorite, isFavorite, isTogglingFavorite, onFavoriteChange, prompt.id]);

  const handleEdit = useCallback(() => {
    setExpanded(false);
    onEdit();
  }, [onEdit]);

  const handleDeleteRequest = useCallback(() => {
    onDeleteRequest?.();
  }, [onDeleteRequest]);

  const handleApply = useCallback(() => {
    setExpanded(false);
    onApply?.();
  }, [onApply]);

  const applyButton = onApply ? (
    <button
      className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
      onClick={handleApply}
      type="button"
    >
      使用
    </button>
  ) : null;

  const favoriteButton = canFavorite ? (
    <button
      aria-label={isFavorite ? "取消收藏" : "收藏"}
      className={cn(
        "absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full transition",
        isFavorite
          ? "text-amber-500 hover:bg-amber-50"
          : "text-zinc-300 hover:bg-zinc-100 hover:text-amber-500"
      )}
      disabled={isTogglingFavorite}
      onClick={(event) => {
        stopCardClick(event);
        void handleFavoriteClick();
      }}
      type="button"
    >
      <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
    </button>
  ) : null;

  const detailModal = expanded ? (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 p-4"
      onClick={() => setExpanded(false)}
      role="presentation"
    >
      <div
        className="flex max-h-[min(85vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={stopCardClick}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-zinc-900">{prompt.title}</h3>
              {prompt.isOfficial ? (
                <span className="inline-flex shrink-0 items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-blue-600 ring-1 ring-blue-100">
                  官方
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", btnSoft)}>
                {getPromptCategoryLabel(prompt.category)}
              </span>
              <span className="text-xs text-zinc-500">已使用 {prompt.usageCount} 次</span>
            </div>
          </div>
          <button
            aria-label="关闭"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
            onClick={() => setExpanded(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-zinc-700">
            {prompt.content}
          </pre>
        </div>
        <div
          className="flex shrink-0 flex-wrap gap-2 border-t border-zinc-100 px-5 py-4"
          onClick={stopCardClick}
        >
          {canManage ? (
            <>
              {applyButton}
              <button
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                onClick={handleEdit}
                type="button"
              >
                <Pencil className="h-3.5 w-3.5" />
                编辑
              </button>
              <button
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                onClick={onCopy}
                type="button"
              >
                <Copy className="h-3.5 w-3.5" />
                复制
              </button>
              <button
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                onClick={handleDeleteRequest}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" />
                删除
              </button>
            </>
          ) : (
            <>
              {applyButton}
              <button
                className={cn(
                  "inline-flex items-center justify-center gap-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50",
                  onApply ? "flex-1" : "w-full"
                )}
                onClick={onCopy}
                type="button"
              >
                <Copy className="h-3.5 w-3.5" />
                复制
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;

  if (compact) {
    return (
      <>
        <article
          className="relative cursor-pointer rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300"
          onClick={openDetail}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openDetail();
            }
          }}
          role="button"
          tabIndex={0}
        >
          {favoriteButton}
          <h3 className={cn("truncate text-sm font-medium text-zinc-900", canFavorite && "pr-7")}>
            {prompt.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
            {buildPostExcerpt(prompt.content, 80)}
          </p>
        </article>
        {detailModal}
      </>
    );
  }

  return (
    <>
      <div className="h-full">
        <article
          className="relative flex h-full cursor-pointer flex-col rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:border-zinc-300"
          onClick={openDetail}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openDetail();
            }
          }}
          role="button"
          tabIndex={0}
        >
          {canFavorite ? (
            <button
              aria-label={isFavorite ? "取消收藏" : "收藏"}
              className={cn(
                "absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full transition",
                isFavorite
                  ? "text-amber-500 hover:bg-amber-50"
                  : "text-zinc-300 hover:bg-zinc-100 hover:text-amber-500"
              )}
              disabled={isTogglingFavorite}
              onClick={(event) => {
                stopCardClick(event);
                void handleFavoriteClick();
              }}
              type="button"
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </button>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col">
            <div
              className={cn(
                "flex flex-wrap items-center gap-2",
                canFavorite && "pr-8"
              )}
            >
              <h3 className="text-base font-semibold text-zinc-900">{prompt.title}</h3>
              {prompt.isOfficial ? (
                <span className="inline-flex shrink-0 items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-blue-600 ring-1 ring-blue-100">
                  官方
                </span>
              ) : null}
            </div>
            <p className="mt-2 min-h-[4.5rem] flex-1 line-clamp-3 text-sm leading-6 text-zinc-600">
              {buildPostExcerpt(prompt.content, 160)}
            </p>
          </div>

          <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", btnSoft)}>
              {getPromptCategoryLabel(prompt.category)}
            </span>
            <span className="text-xs text-zinc-500">已使用 {prompt.usageCount} 次</span>
          </div>
        </article>
      </div>
      {detailModal}
    </>
  );
}
