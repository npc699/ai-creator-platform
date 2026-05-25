import type { Prompt } from "@/lib/generated/prisma/client";
import { prismaCategoryToSlug, type PromptCategorySlug } from "@/lib/prompts/category";
import type { PromptListRecord } from "@/lib/prompts/list";

export type SerializedPrompt = {
  id: string;
  title: string;
  content: string;
  category: PromptCategorySlug;
  isOfficial: boolean;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

type SerializeOptions = {
  isFavorite?: boolean;
};

export function serializePrompt(
  prompt: Prompt | PromptListRecord,
  options?: SerializeOptions
): SerializedPrompt {
  const isOfficial = prompt.isOfficial;
  let isFavorite = options?.isFavorite;

  if (isFavorite === undefined) {
    if (isOfficial && "favorites" in prompt && Array.isArray(prompt.favorites)) {
      isFavorite = prompt.favorites.length > 0;
    } else {
      isFavorite = prompt.isFavorite;
    }
  }

  return {
    id: prompt.id,
    title: prompt.title,
    content: prompt.content,
    category: prismaCategoryToSlug(prompt.category),
    isOfficial,
    isFavorite,
    usageCount: prompt.usageCount,
    createdAt: prompt.createdAt.toISOString(),
    updatedAt: prompt.updatedAt.toISOString(),
  };
}

export function serializePromptList(prompts: PromptListRecord[]): SerializedPrompt[] {
  return prompts.map((prompt) => serializePrompt(prompt));
}
