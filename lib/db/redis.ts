import "server-only";

import { createClient } from "redis";

const globalForRedis = globalThis as unknown as {
  redis?: ReturnType<typeof createClient>;
  redisConnectPromise?: Promise<ReturnType<typeof createClient>>;
};

// Redis 客户端在开发热更新期间复用，避免重复创建连接。
export const redis =
  globalForRedis.redis ??
  createClient({
    url: process.env.REDIS_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function getRedis() {
  if (redis.isOpen) {
    return redis;
  }

  // 并发请求首次连接 Redis 时共用同一个连接 Promise。
  globalForRedis.redisConnectPromise ??= redis.connect().then(() => redis);

  return globalForRedis.redisConnectPromise;
}
