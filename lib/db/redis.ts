// 服务端 Redis 客户端：懒连接 + dev 单例；Feed/审核缓存通过 getRedis() 使用，调用方自行 try/catch 降级。
import "server-only";

import { createClient } from "redis";

const globalForRedis = globalThis as unknown as {
  redis?: ReturnType<typeof createClient>;
  redisConnectPromise?: Promise<ReturnType<typeof createClient>>;
};

// 模块加载即建 client 对象，但不主动 connect；避免未配置 REDIS_URL 时拖垮整应用启动。
export const redis =
  globalForRedis.redis ??
  createClient({
    url: process.env.REDIS_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/** 返回已连接的客户端；首次调用会 connect，并发调用共用同一 Promise。 */
export async function getRedis() {
  if (redis.isOpen) {
    return redis;
  }

  globalForRedis.redisConnectPromise ??= redis.connect().then(() => redis);

  return globalForRedis.redisConnectPromise;
}
