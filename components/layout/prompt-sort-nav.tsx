"use client";

import { useSearchParams } from "next/navigation";

import { PanelTabNav } from "@/components/layout/panel-tab-nav";
import {
  buildPromptsQuery,
  PROMPT_CATEGORY_OPTIONS,
  parsePromptCategory,
} from "@/lib/feed/panel-params";

export function PromptSortNav() {
  const searchParams = useSearchParams();
  const category = parsePromptCategory(searchParams.get("category"));

  return (
    <PanelTabNav
      activeKey={category}
      ariaLabel="Prompt 分类"
      options={PROMPT_CATEGORY_OPTIONS.map(({ category: categoryKey, label }) => ({
        key: categoryKey,
        label,
        href: buildPromptsQuery({ category: categoryKey }),
      }))}
    />
  );
}
