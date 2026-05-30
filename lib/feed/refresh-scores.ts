import "server-only";

import { prisma } from "@/lib/db";
import { getFeedRankingSince } from "@/lib/feed/feed-window";
import { computeHotScore } from "@/lib/feed/hot-score";
import { computeViralScore } from "@/lib/feed/viral-score";
import { invalidateFeedChannelCache } from "@/lib/feed/cache";
import { PostStatus } from "@/lib/generated/prisma/client";

const BATCH_SIZE = 100;

/** 刷新近 7 天已发布文章的热点/爆文预计算分并写库。 */
export async function refreshFeedScores(now = new Date()) {
  const since = getFeedRankingSince(now);

  const posts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      publishedAt: { gte: since },
    },
    select: {
      id: true,
      likeCount: true,
      viewCount: true,
      qualityScore: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  for (let offset = 0; offset < posts.length; offset += BATCH_SIZE) {
    const batch = posts.slice(offset, offset + BATCH_SIZE);
    await prisma.$transaction(
      batch.map((post) =>
        prisma.post.update({
          where: { id: post.id },
          data: {
            hotScore: computeHotScore({ ...post, now }),
            viralScore: computeViralScore({ ...post, now }),
            scoreUpdatedAt: now,
          },
        })
      )
    );
  }

  await invalidateFeedChannelCache();

  return { updated: posts.length, since: since.toISOString() };
}
