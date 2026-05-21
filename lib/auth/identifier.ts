import "server-only";

import { prisma } from "@/lib/db";

import {
  isValidAuthEmail,
  isValidAuthPhone,
  normalizePhone,
} from "./validators";

export type AuthIdentifier =
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string };

export function parseAuthIdentifier(raw: string): AuthIdentifier | null {
  const value = raw.trim();

  if (!value) {
    return null;
  }

  if (value.includes("@")) {
    const email = value.toLowerCase();

    if (!isValidAuthEmail(email)) {
      return null;
    }

    return { kind: "email", value: email };
  }

  if (!isValidAuthPhone(value)) {
    return null;
  }

  return { kind: "phone", value: normalizePhone(value) };
}

// 按邮箱或手机号查询可密码登录的用户。
export async function findUserByIdentifier(identifier: AuthIdentifier) {
  if (identifier.kind === "email") {
    return prisma.user.findUnique({
      where: { email: identifier.value },
    });
  }

  return prisma.user.findUnique({
    where: { phone: identifier.value },
  });
}
