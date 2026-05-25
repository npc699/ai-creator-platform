import { prisma } from "@/lib/db";
import { unpublishedDraftWhere } from "@/lib/drafts/query";
import { PostStatus } from "@/lib/generated/prisma/client";

export type CreatorSidebarStats = {
  publishedCount: number;
  draftCount: number;
  totalViews: string;
};

/** 已发布文章：含上线与下线。 */
const sidebarPostStatuses = [PostStatus.PUBLISHED, PostStatus.ARCHIVED] as const;

function formatViewCount(count: number) {
  if (count >= 10_000) {
    return `${(count / 10_000).toFixed(1).replace(/\.0$/, "")}万`;
  }
  return count.toLocaleString("zh-CN");
}

/** 右侧边栏创作者统计：各 Feed 页共用，避免按路由各自传参导致数据不一致。 */
export async function getCreatorSidebarStats(
  userId: string
): Promise<CreatorSidebarStats> {
  const [publishedCount, draftCount, viewsAggregate] = await Promise.all([
    prisma.post.count({
      where: {
        userId,
        status: { in: [...sidebarPostStatuses] },
      },
    }),
    prisma.draft.count({
      where: {
        userId,
        ...unpublishedDraftWhere,
      },
    }),
    prisma.post.aggregate({
      where: {
        userId,
        status: { in: [...sidebarPostStatuses] },
      },
      _sum: { viewCount: true },
    }),
  ]);

  return {
    publishedCount,
    draftCount,
    totalViews: formatViewCount(viewsAggregate._sum.viewCount ?? 0),
  };
}

export const emptyCreatorSidebarStats: CreatorSidebarStats = {
  publishedCount: 0,
  draftCount: 0,
  totalViews: "0",
};
