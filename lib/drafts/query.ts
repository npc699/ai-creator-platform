import type { Prisma } from "@/lib/generated/prisma/client";

/** 草稿箱仅展示尚未发布的草稿（Post 已关联或发布后已删除的草稿均不展示）。 */
export const unpublishedDraftWhere: Prisma.DraftWhereInput = {
  post: { is: null },
};

export function buildDraftListWhere(userId: string): Prisma.DraftWhereInput {
  return {
    userId,
    ...unpublishedDraftWhere,
  };
}
