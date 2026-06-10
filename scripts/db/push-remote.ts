// Windows + Neon 下 prisma db push 可能 P1001，但 node pg 可连；本脚本用 migrate diff 生成 SQL 再经 pg 执行。
// 运行：npm run db:push:remote
import "dotenv/config";

import { execFileSync } from "node:child_process";

import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置");
}

function runPrismaDiff(args: string[]) {
  return execFileSync("npx", ["prisma", "migrate", "diff", ...args, "--script"], {
    encoding: "utf8",
    env: process.env,
    shell: process.platform === "win32",
  }).trim();
}

async function main() {
  const client = new pg.Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    const exists = await client.query<{ user_table: string | null }>(
      `SELECT to_regclass('public."User"') AS user_table`
    );

    if (exists.rows[0]?.user_table) {
      console.log('检测到 "User" 表，跳过 schema 初始化。若需 prisma db push，请在可连环境执行。');
      return;
    }

    const sql = runPrismaDiff(["--from-empty", "--to-schema", "prisma/schema.prisma"]);

    if (!sql) {
      console.log("无需 schema 变更。");
      return;
    }

    await client.query(sql);
    console.log("已通过 pg 客户端在远程数据库创建 schema。");
  } finally {
    await client.end();
  }

  execFileSync("npm", ["run", "db:generate"], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
}

main().catch((error) => {
  console.error("db:push:remote 失败:", error);
  process.exit(1);
});
