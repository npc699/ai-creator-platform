import { z } from "zod";

// 标准邮箱格式；开发环境额外允许 *@localhost。
export function isValidAuthEmail(email: string) {
  if (z.email().safeParse(email).success) {
    return true;
  }

  return /^[^\s@]+@localhost$/i.test(email);
}

// 中国大陆手机号：1 开头 11 位；存储时统一为纯数字。
const mainlandPhonePattern = /^1[3-9]\d{9}$/;

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 13 && digits.startsWith("86")) {
    return digits.slice(2);
  }

  return digits;
}

export function isValidAuthPhone(raw: string) {
  return mainlandPhonePattern.test(normalizePhone(raw));
}
