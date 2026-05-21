import { createClient } from "redis";

const globalForRedis = globalThis as unknown as {
  redis?: ReturnType<typeof createClient>;
  redisConnectPromise?: Promise<ReturnType<typeof createClient>>;
};

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

  globalForRedis.redisConnectPromise ??= redis.connect().then(() => redis);

  return globalForRedis.redisConnectPromise;
}
