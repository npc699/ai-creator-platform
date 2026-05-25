"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import {
  PROMPT_CATEGORY_OPTIONS,
  PROMPT_SCOPE_OPTIONS,
  buildPromptsQuery,
  type PromptCategory,
} from "@/lib/feed/panel-params";
import type { PromptScope } from "@/lib/prompts/query";
import { btnEditorHeaderGhost } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type PromptFiltersHeaderProps = {
  activeScope: PromptScope;
  activeCategory: PromptCategory;
  onCreateClick: () => void;
};

/** 筛选 Tab：常态文字，悬停/选中时灰底 + 字色加深，与顶栏 ghost 按钮一致。 */
function filterTabClass(isActive: boolean) {
  return cn(
    "inline-flex shrink-0 items-center rounded-xl px-3 py-1.5 text-xs font-medium transition",
    isActive
      ? "bg-zinc-100 text-zinc-950!"
      : "text-zinc-600! hover:bg-zinc-100 hover:text-zinc-950!"
  );
}

export function PromptFiltersHeader({
  activeScope,
  activeCategory,
  onCreateClick,
}: PromptFiltersHeaderProps) {
  const scope = activeScope;
  const category = activeCategory;

  return (
    <div className="space-y-3 border-b border-zinc-200/80 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">Prompt 库</h2>
        <button
          className={btnEditorHeaderGhost}
          onClick={onCreateClick}
          type="button"
        >
          <Plus className="h-4 w-4" />
          新建 Prompt
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PROMPT_SCOPE_OPTIONS.map(({ scope: scopeKey, label }) => {
          const isActive = scope === scopeKey;

          return (
            <Link
              className={filterTabClass(isActive)}
              href={buildPromptsQuery({ scope: scopeKey, category })}
              key={scopeKey}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <div className="flex w-max items-center gap-2 pb-1">
          {PROMPT_CATEGORY_OPTIONS.map(({ category: categoryKey, label }) => {
            const isActive = category === categoryKey;

            return (
              <Link
                className={filterTabClass(isActive)}
                href={buildPromptsQuery({ scope, category: categoryKey })}
                key={categoryKey}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
