import type { Prisma } from "@/lib/generated/prisma/client";

/** 草稿箱仅展示尚未发布的新文章草稿（排除 EditDraft 与已发布绑定的草稿）。 */
export const unpublishedDraftWhere: Prisma.DraftWhereInput = {
  publishedAs: { is: null },
  sourcePostId: null,
};

export function buildDraftListWhere(userId: string): Prisma.DraftWhereInput {
  return {
    userId,
    ...unpublishedDraftWhere,
  };
}
