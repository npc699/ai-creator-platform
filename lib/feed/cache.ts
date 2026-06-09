import "server-only";

import { getRedis } from "@/lib/db";
import { prisma } from "@/lib/db";
import type { FeedChannel } from "@/lib/feed/params";
import type { HomeFeedPageResult } from "@/lib/feed/home/query";
import { getFeedRankingSince } from "@/lib/feed/scores/window";
import {
  PostStatus,
  ReviewStatus,
  type Prisma,
} from "@/lib/generated/prisma/client";

const HOT_CACHE_TTL_SECONDS = 120;
const VIRAL_CACHE_TTL_SECONDS = 300;

function feedCacheKey(parts: {
  channel: FeedChannel;
  topic: string | null;
  excludeUserId: string | null;
  limit: number;
}) {
  const topic = parts.topic ?? "_";
  const viewer = parts.excludeUserId ?? "global";
  return `feed:${parts.channel}:first:${topic}:${viewer}:${parts.limit}`;
}

export function getFeedCacheTtl(channel: FeedChannel) {
  return channel === "hot" ? HOT_CACHE_TTL_SECONDS : VIRAL_CACHE_TTL_SECONDS;
}

/** ????????? cursor?????? key ??? */
export async function getCachedFeedFirstPage(
  key: string
): Promise<HomeFeedPageResult | null> {
  try {
    const client = await getRedis();
    const raw = await client.get(key);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as HomeFeedPageResult;
  } catch {
    return null;
  }
}

export async function setCachedFeedFirstPage(
  key: string,
  payload: HomeFeedPageResult,
  ttlSeconds: number
) {
  try {
    const client = await getRedis();
    await client.setEx(key, ttlSeconds, JSON.stringify(payload));
  } catch {
    // ??????????
  }
}

export function buildFeedFirstPageCacheKey(options: {
  channel: FeedChannel;
  topic: string | null;
  excludeUserId: string | null;
  limit: number;
}) {
  return feedCacheKey(options);
}

/** ???????????/??????? */
export async function invalidateFeedChannelCache() {
  try {
    const client = await getRedis();
    const keys = await client.keys("feed:hot:first:*");
    const viralKeys = await client.keys("feed:viral:first:*");
    const all = [...keys, ...viralKeys];
    if (all.length > 0) {
      await client.del(all);
    }
  } catch {
    // ?? Redis ???
  }
}

/** ??/????????????????????????? */
export function buildLeaderboardEligibleWhere(
  now = new Date()
): Prisma.PostWhereInput {
  return {
    status: PostStatus.PUBLISHED,
    reviewStatus: ReviewStatus.PASSED,
    publishedAt: { gte: getFeedRankingSince(now) },
  };
}

/** ??????????????/??????? */
export async function invalidateFeedLeaderboardOnPostVisibilityChange() {
  await invalidateFeedChannelCache();
}

/** ???????????????????????? id? */
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
