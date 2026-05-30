import "server-only";

import { getRedis } from "@/lib/db/redis";
import type { FeedChannel } from "@/lib/feed/params";
import type { HomeFeedPageResult } from "@/lib/posts/home-feed-query";

const HOT_CACHE_TTL_SECONDS = 120;
const VIRAL_CACHE_TTL_SECONDS = 300;

function feedCacheKey(parts: {
  channel: FeedChannel;
  topic: string | null;
  excludeUserId: string | null;
  limit: number;
}) {
  const topic = parts.topic ?? "_";
  // 热点/爆文首屏缓存调用方应传 excludeUserId=null，此处统一为 global
  const viewer = parts.excludeUserId ?? "global";
  return `feed:${parts.channel}:first:${topic}:${viewer}:${parts.limit}`;
}

export function getFeedCacheTtl(channel: FeedChannel) {
  return channel === "hot" ? HOT_CACHE_TTL_SECONDS : VIRAL_CACHE_TTL_SECONDS;
}

/** 仅缓存榜单首屏（无 cursor），降低深页 key 数量。 */
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
    // 缓存失败不阻断主流程
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

/** 刷分后清除热点/爆文首屏缓存。 */
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
    // 忽略 Redis 不可用
  }
}
