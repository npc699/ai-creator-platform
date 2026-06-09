// 服务端 Prisma 单例：@prisma/adapter-pg 直连 PostgreSQL，勿在 Client Component 中导入。
import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaCacheKey?: string;
};

const databaseUrl = process.env.DATABASE_URL;

// 启动期即失败，避免请求跑到一半才因缺库配置抛错。
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// schema / generate 变更后递增；dev 热更新会保留 global 上的旧实例，不 bump 易出现 delegate 缺失。
const PRISMA_CLIENT_CACHE_KEY = "cover-url-v1";

const adapter = new PrismaPg(databaseUrl);

function createPrismaClient() {
  return new PrismaClient({
    adapter,
  });
}

function isPrismaClientCacheValid(client: PrismaClient | undefined): client is PrismaClient {
  if (!client) {
    return false;
  }

  if (globalForPrisma.prismaCacheKey !== PRISMA_CLIENT_CACHE_KEY) {
    return false;
  }

  // 除 cache key 外再探测关键 delegate：仅 bump key 时旧进程仍可能短暂持有不完整 client。
  return (
    typeof client.asset?.create === "function" &&
    typeof client.prompt?.findMany === "function" &&
    typeof client.promptFavorite?.upsert === "function"
  );
}

const cachedPrisma = globalForPrisma.prisma;

export const prisma = isPrismaClientCacheValid(cachedPrisma)
  ? cachedPrisma
  : createPrismaClient();

// 仅 dev 写入 global，减轻 HMR 下连接泄漏；生产依赖模块级 export 在单进程内复用。
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaCacheKey = PRISMA_CLIENT_CACHE_KEY;
}
