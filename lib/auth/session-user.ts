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
