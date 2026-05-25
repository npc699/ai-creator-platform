import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient, Role } from "../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置，无法创建测试账号");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

const OUTPUT_DIR = path.join(process.cwd(), "local", "test-accounts");

/** 5 个固定测试账号，凭据写入 local/test-accounts（已 gitignore）。 */
const TEST_USERS = [
  {
    email: "test01@localhost",
    name: "测试用户01",
    password: "TestUser01!",
    label: "创作者 A",
  },
  {
    email: "test02@localhost",
    name: "测试用户02",
    password: "TestUser02!",
    label: "创作者 B",
  },
  {
    email: "test03@localhost",
    name: "测试用户03",
    password: "TestUser03!",
    label: "创作者 C",
  },
  {
    email: "test04@localhost",
    name: "测试用户04",
    password: "TestUser04!",
    label: "创作者 D",
  },
  {
    email: "test05@localhost",
    name: "测试用户05",
    password: "TestUser05!",
    label: "创作者 E",
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
    note: "仅供本地开发测试，请勿提交到 Git 或用于生产环境。",
    loginUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000/login",
    accounts: created,
  };

  await writeFile(
    path.join(OUTPUT_DIR, "accounts.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8"
  );

  const textLines = [
    "AI 创作者平台 · 本地测试账号",
    `生成时间: ${generatedAt}`,
    `登录地址: ${payload.loginUrl}`,
    "",
    "说明: 以下账号角色均为 USER，与现有管理员账号相互独立。",
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
