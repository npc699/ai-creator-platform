import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  /** schema 结构变更后递增，避免 dev 热更新沿用旧 PrismaClient */
  prismaCacheKey?: string;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

/** Prompt 增加 isOfficial / PromptFavorite 后更新此 key，强制重建客户端 */
const PRISMA_CLIENT_CACHE_KEY = "prompt-official-v1";

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

  // schema 新增模型/字段后若仍复用旧实例，会出现 delegate 缺失或 where 字段校验失败
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

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaCacheKey = PRISMA_CLIENT_CACHE_KEY;
}
