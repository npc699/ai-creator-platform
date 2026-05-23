import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg(databaseUrl);

function createPrismaClient() {
  return new PrismaClient({
    adapter,
  });
}

// 开发环境会频繁热更新，复用全局客户端可以避免重复建立数据库连接。
// schema 新增模型后若仍复用旧实例，会出现 prisma.asset 为 undefined；此处检测并重建。
const cachedPrisma = globalForPrisma.prisma;
const hasAssetDelegate =
  cachedPrisma &&
  typeof (cachedPrisma as { asset?: { create?: unknown } }).asset?.create ===
    "function";

export const prisma = hasAssetDelegate ? cachedPrisma : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
