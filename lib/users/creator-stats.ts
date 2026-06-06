import { prisma } from "@/lib/db";
import { unpublishedDraftWhere } from "@/lib/drafts/query";
import { PostStatus } from "@/lib/generated/prisma/client";

/** 创作者「已发布」口径：含已上线与已下线，与已发布页、右侧边栏一致。 */
export const CREATOR_PUBLISHED_POST_STATUSES = [
  PostStatus.PUBLISHED,
  PostStatus.ARCHIVED,
] as const;

export type CreatorStats = {
  publishedCount: number;
  draftCount: number;
  totalViews: number;
  totalLikes: number;
};

export type CreatorSidebarStats = {
  publishedCount: number;
  draftCount: number;
  totalViews: string;
};

/** 创作者统计数字展示（与右侧边栏一致，≥1 万用「万」）。 */
export function formatCreatorStatCount(count: number): string {
  if (count >= 10_000) {
    return `${(count / 10_000).toFixed(1).replace(/\.0$/, "")}万`;
  }
  return count.toLocaleString("zh-CN");
}

/** 创作者文章与互动汇总（已发布含下线稿）。 */
export async function getCreatorStats(userId: string): Promise<CreatorStats> {
  const publishedWhere = {
    userId,
    status: { in: [...CREATOR_PUBLISHED_POST_STATUSES] },
  };

  const [publishedCount, draftCount, aggregate] = await Promise.all([
    prisma.post.count({ where: publishedWhere }),
    prisma.draft.count({
      where: {
        userId,
        ...unpublishedDraftWhere,
      },
    }),
    prisma.post.aggregate({
      where: publishedWhere,
      _sum: { viewCount: true, likeCount: true },
    }),
  ]);

  return {
    publishedCount,
    draftCount,
    totalViews: aggregate._sum.viewCount ?? 0,
    totalLikes: aggregate._sum.likeCount ?? 0,
  };
}

/** 右侧边栏创作者统计：各 Feed 页共用同一查询。 */
export async function getCreatorSidebarStats(
  userId: string
): Promise<CreatorSidebarStats> {
  const stats = await getCreatorStats(userId);

  return {
    publishedCount: stats.publishedCount,
    draftCount: stats.draftCount,
    totalViews: formatCreatorStatCount(stats.totalViews),
  };
}

export const emptyCreatorSidebarStats: CreatorSidebarStats = {
  publishedCount: 0,
  draftCount: 0,
  totalViews: "0",
};
