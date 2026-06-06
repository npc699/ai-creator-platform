"use client";

import { Plus } from "lucide-react";

import { PromptFilterTabs } from "@/components/prompts/filter-tabs";
import type { PromptCategory } from "@/lib/prompts/panel-params";
import type { PromptScope } from "@/lib/prompts/query";
import { btnEditorHeaderGhost } from "@/lib/utils/brand";

type PromptFiltersHeaderProps = {
  activeScope: PromptScope;
  activeCategory: PromptCategory;
  onCreateClick: () => void;
};

export function PromptFiltersHeader({
  activeScope,
  activeCategory,
  onCreateClick,
}: PromptFiltersHeaderProps) {
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

      <PromptFilterTabs
        activeCategory={activeCategory}
        activeScope={activeScope}
        mode="link"
      />
    </div>
  );
}
