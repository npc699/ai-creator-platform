// 默认数据库种子（prisma.config.ts → npm run db:seed）：仅创建/更新一名开发 ADMIN，供首次登录。
// 独立 PrismaClient：CLI 一次性脚本，不走 lib/db 单例，避免与 Next 进程共享 global 状态。
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient, Role } from "../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置，无法执行 seed");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

// 凭据走环境变量，避免把真实密码提交进仓库；未配置时用 README 文档默认值。
const adminEmail = (
  process.env.DEV_ADMIN_EMAIL ?? "admin@localhost"
).toLowerCase();
const adminPassword = process.env.DEV_ADMIN_PASSWORD ?? "Admin12345";
const adminName = process.env.DEV_ADMIN_NAME ?? "管理员";

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: Role.ADMIN,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  console.log("开发管理员账号已就绪：");
  console.log(`  邮箱: ${admin.email}`);
  console.log(`  用户名: ${admin.name}`);
  console.log(`  角色: ${admin.role}`);
  console.log(`  密码: ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error("seed 执行失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
