"use client";

import Link from "next/link";

import {
  PROMPT_CATEGORY_OPTIONS,
  PROMPT_SCOPE_OPTIONS,
  buildPromptsQuery,
  type PromptCategory,
} from "@/lib/prompts/panel-params";
import type { PromptScope } from "@/lib/prompts/query";
import { cn } from "@/lib/utils";

/** 筛选 Tab：常态文字，悬停/选中时灰底 + 字色加深，与顶栏 ghost 按钮一致。 */
export function filterTabClass(isActive: boolean) {
  return cn(
    "inline-flex shrink-0 items-center rounded-xl px-3 py-1.5 text-xs font-medium transition",
    isActive
      ? "bg-zinc-100 text-zinc-950!"
      : "text-zinc-600! hover:bg-zinc-100 hover:text-zinc-950!"
  );
}

type ScopeOption = {
  scope: string;
  label: string;
};

type PromptFilterTabsProps = {
  mode: "link" | "button";
  activeScope: string;
  activeCategory: PromptCategory;
  scopeOptions?: ScopeOption[];
  onScopeChange?: (scope: string) => void;
  onCategoryChange?: (category: PromptCategory) => void;
};

export function PromptFilterTabs({
  mode,
  activeScope,
  activeCategory,
  scopeOptions = PROMPT_SCOPE_OPTIONS,
  onScopeChange,
  onCategoryChange,
}: PromptFilterTabsProps) {
  const scope = activeScope;
  const category = activeCategory;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {scopeOptions.map(({ scope: scopeKey, label }) => {
          const isActive = scope === scopeKey;

          if (mode === "link") {
            return (
              <Link
                className={filterTabClass(isActive)}
                href={buildPromptsQuery({
                  scope: scopeKey as PromptScope,
                  category,
                })}
                key={scopeKey}
              >
                {label}
              </Link>
            );
          }

          return (
            <button
              className={filterTabClass(isActive)}
              key={scopeKey}
              onClick={() => onScopeChange?.(scopeKey)}
              type="button"
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <div className="flex w-max items-center gap-2 pb-1">
          {PROMPT_CATEGORY_OPTIONS.map(({ category: categoryKey, label }) => {
            const isActive = category === categoryKey;

            if (mode === "link") {
              return (
                <Link
                  className={filterTabClass(isActive)}
                  href={buildPromptsQuery({
                    scope: scope as PromptScope,
                    category: categoryKey,
                  })}
                  key={categoryKey}
                >
                  {label}
                </Link>
              );
            }

            return (
              <button
                className={filterTabClass(isActive)}
                key={categoryKey}
                onClick={() => onCategoryChange?.(categoryKey)}
                type="button"
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
