// 按用户 ID 回查数据库中的活跃用户，供 session callback 与 proxy.ts 共用。
// 与 JWT 解耦后，proxy 可在不引入完整 Auth.js 栈的情况下校验删号状态。
import "server-only";

import { prisma } from "@/lib/db";
import type { Role } from "@/lib/generated/prisma/client";

const activeUserSelect = {
  id: true,
  email: true,
  phone: true,
  name: true,
  image: true,
  role: true,
} as const;

/** JWT 有效且用户仍存在时返回的会话用户快照。 */
export type ActiveSessionUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  image: string | null;
  role: Role;
};

// 按 JWT 中的用户 ID 回查数据库，删号后可使会话立即失效。
export async function findActiveUserById(
  userId: string | undefined
): Promise<ActiveSessionUser | null> {
  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: activeUserSelect,
  });
}
