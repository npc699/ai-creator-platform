// 可选种子：创建 5 个固定 USER 测试账号，并把邮箱/密码/userId 写入 local/test-accounts（gitignore）。
// 运行：npm run db:seed:test-users；下游 seed-test-posts 依赖 accounts.json 解析 userId。
import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient, Role } from "../../../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置，无法创建测试账号");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

const OUTPUT_DIR = path.join(process.cwd(), "local", "test-accounts");

const TEST_USERS = [
  {
    email: "linxiaozhou@qq.com",
    name: "林晓舟",
    password: "LinXz2026!",
    label: "林晓舟",
  },
  {
    email: "suwanqing@163.com",
    name: "苏晚晴",
    password: "SuWq2026!",
    label: "苏晚晴",
  },
  {
    email: "zhouyian@outlook.com",
    name: "周予安",
    password: "ZhouYa2026!",
    label: "周予安",
  },
  {
    email: "xujiayan@foxmail.com",
    name: "许嘉言",
    password: "XuJy2026!",
    label: "许嘉言",
  },
  {
    email: "tangyingzhen@gmail.com",
    name: "唐映真",
    password: "TangYz2026!",
    label: "唐映真",
  },
] as const;

type CreatedAccount = {
  label: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  userId: string;
};

async function main() {
  const created: CreatedAccount[] = [];

  for (const account of TEST_USERS) {
    const passwordHash = await bcrypt.hash(account.password, 12);

    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        passwordHash,
        role: Role.USER,
      },
      create: {
        email: account.email,
        name: account.name,
        passwordHash,
        role: Role.USER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    created.push({
      label: account.label,
      name: user.name ?? account.name,
      email: user.email ?? account.email,
      password: account.password,
      role: user.role,
      userId: user.id,
    });

    console.log(`已就绪: ${user.email} (${account.label})`);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const generatedAt = new Date().toISOString();
  const payload = {
    generatedAt,
    note: "仅供本地/演示环境测试，请勿提交到 Git 或用于真实生产用户。",
    loginUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000/login",
    accounts: created,
  };

  await writeFile(
    path.join(OUTPUT_DIR, "accounts.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8"
  );

  const textLines = [
    "AI 创作者平台 · 测试账号凭据",
    `生成时间: ${generatedAt}`,
    `登录地址: ${payload.loginUrl}`,
    "",
    "说明: 以下账号角色均为 USER，与管理员账号相互独立。",
    "",
    ...created.flatMap((account, index) => [
      `--- 账号 ${index + 1}: ${account.label} ---`,
      `邮箱: ${account.email}`,
      `密码: ${account.password}`,
      `昵称: ${account.name}`,
      `角色: ${account.role}`,
      `用户 ID: ${account.userId}`,
      "",
    ]),
  ];

  await writeFile(path.join(OUTPUT_DIR, "accounts.txt"), textLines.join("\n"), "utf8");

  console.log("");
  console.log(`凭据已写入: ${OUTPUT_DIR}`);
  console.log("  - accounts.json");
  console.log("  - accounts.txt");
}

main()
  .catch((error) => {
    console.error("创建测试账号失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
