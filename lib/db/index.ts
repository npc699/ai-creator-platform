// 数据访问模块服务端入口：Prisma 与 Redis 单例。
// 含 import "server-only"，不可在 Client Component 中 import。
import "server-only";

export { prisma } from "./prisma";
export { getRedis, redis } from "./redis";
