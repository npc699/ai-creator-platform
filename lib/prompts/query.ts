import type { Prisma } from "@/lib/generated/prisma/client";
import type { PromptCategorySlug } from "./category";
import type { SerializedPrompt } from "./serialize";

export const PROMPT_SCOPES = ["official", "mine", "favorite"] as const;
export type PromptScope = (typeof PROMPT_SCOPES)[number];

export const PROMPT_SCOPE_OPTIONS: { scope: PromptScope; label: string }[] = [
  { scope: "official", label: "官方" },
  { scope: "mine", label: "我的" },
  { scope: "favorite", label: "收藏" },
];

/** 编辑器侧栏 Prompt 库仅展示「我的」与「收藏」。 */
export const EDITOR_PROMPT_SCOPES = ["mine", "favorite"] as const;
export type EditorPromptScope = (typeof EDITOR_PROMPT_SCOPES)[number];

export const EDITOR_PROMPT_SCOPE_OPTIONS: {
  scope: EditorPromptScope;
  label: string;
}[] = [
  { scope: "mine", label: "我的" },
  { scope: "favorite", label: "收藏" },
];

export const PROMPT_SORTS = ["updated", "created", "usage", "title"] as const;
export type PromptSort = (typeof PROMPT_SORTS)[number];

export const PROMPT_SORT_OPTIONS: { sort: PromptSort; label: string }[] = [
  { sort: "updated", label: "最近更新" },
  { sort: "created", label: "最近创建" },
  { sort: "usage", label: "使用最多" },
  { sort: "title", label: "标题 A-Z" },
];

export function parsePromptScope(value: string | null): PromptScope {
  if (value === "mine" || value === "favorite") {
    return value;
  }
  // 兼容旧链接 scope=all
  return "official";
}

export function parsePromptSort(value: string | null): PromptSort {
  if (value === "created" || value === "usage" || value === "title") {
    return value;
  }
  return "updated";
}

export function buildPromptListOrderBy(sort: PromptSort): Prisma.PromptOrderByWithRelationInput {
  switch (sort) {
    case "created":
      return { createdAt: "desc" };
    case "usage":
      return { usageCount: "desc" };
    case "title":
      return { title: "asc" };
    default:
      return { updatedAt: "desc" };
  }
}

export function sortPrompts(
  prompts: SerializedPrompt[],
  sort: PromptSort
): SerializedPrompt[] {
  const copy = [...prompts];

  switch (sort) {
    case "created":
      return copy.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case "usage":
      return copy.sort((a, b) => b.usageCount - a.usageCount);
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
    default:
      return copy.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }
}

export function getPromptEmptyMessage(
  scope: PromptScope,
  category: "all" | PromptCategorySlug
): string {
  if (scope === "favorite") {
    return category === "all"
      ? "还没有收藏的官方 Prompt，在官方库点击星标即可收藏"
      : "该分类下暂无收藏的官方 Prompt";
  }

  if (scope === "mine") {
    return category === "all"
      ? "还没有自建 Prompt，点击右上角新建"
      : "该分类下暂无自建 Prompt，点击右上角新建";
  }

  if (category !== "all") {
    return "该分类下暂无官方 Prompt";
  }

  return "暂无官方 Prompt";
}
