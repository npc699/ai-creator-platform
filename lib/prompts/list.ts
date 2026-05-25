import type { Prisma } from "@/lib/generated/prisma/client";
import type { PromptCategorySlug } from "@/lib/prompts/category";
import { slugToPrismaCategory } from "@/lib/prompts/category";
import type { PromptScope } from "@/lib/prompts/query";

/** 列表查询时附带当前用户对官方 Prompt 的收藏状态。 */
export function promptListInclude(userId: string) {
  return {
    favorites: {
      where: { userId },
      select: { id: true },
      take: 1,
    },
  } satisfies Prisma.PromptInclude;
}

export type PromptListRecord = Prisma.PromptGetPayload<{
  include: ReturnType<typeof promptListInclude>;
}>;

export function buildPromptListWhere(
  userId: string,
  scope: PromptScope,
  category: "all" | PromptCategorySlug
): Prisma.PromptWhereInput {
  const categoryFilter = prismaCategoryFilter(category);

  switch (scope) {
    case "mine":
      return {
        userId,
        isOfficial: false,
        ...categoryFilter,
      };
    case "favorite":
      return {
        isOfficial: true,
        favorites: { some: { userId } },
        ...categoryFilter,
      };
    default:
      return {
        isOfficial: true,
        ...categoryFilter,
      };
  }
}

function prismaCategoryFilter(
  category: "all" | PromptCategorySlug
): Prisma.PromptWhereInput {
  if (category === "all") {
    return {};
  }

  return { category: slugToPrismaCategory(category) };
}
