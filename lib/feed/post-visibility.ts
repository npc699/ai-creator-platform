import "server-only";

import { getFeedRankingSince } from "@/lib/feed/feed-window";
import { invalidateFeedChannelCache } from "@/lib/feed/cache";
import { prisma } from "@/lib/db";
import { PostStatus, ReviewStatus, type Prisma } from "@/lib/generated/prisma/client";

/** 热点/爆文榜仅展示已上线且审核通过、在统计窗口内的文章。 */
export function buildLeaderboardEligibleWhere(
  now = new Date()
): Prisma.PostWhereInput {
  return {
    status: PostStatus.PUBLISHED,
    reviewStatus: ReviewStatus.PASSED,
    publishedAt: { gte: getFeedRankingSince(now) },
  };
}

/** 文章上下线或删除后，清除热点/爆文首屏缓存。 */
export async function invalidateFeedLeaderboardOnPostVisibilityChange() {
  await invalidateFeedChannelCache();
}

/** 校验缓存条目是否仍符合上榜条件，返回应剔除的文章 id。 */
export async function findLeaderboardIneligiblePostIds(
  postIds: string[],
  now = new Date()
): Promise<Set<string>> {
  if (!postIds.length) {
    return new Set();
  }

  const eligible = await prisma.post.findMany({
    where: {
      id: { in: postIds },
      ...buildLeaderboardEligibleWhere(now),
    },
    select: { id: true },
  });
  const eligibleSet = new Set(eligible.map((post) => post.id));
  return new Set(postIds.filter((id) => !eligibleSet.has(id)));
}
