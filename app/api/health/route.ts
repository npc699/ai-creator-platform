import { NextResponse } from "next/server";

import { getRedis, prisma } from "@/lib/db";

export async function GET() {
  // 各依赖独立检查，便于响应中展示部分故障。
  const checks = {
    database: "ok",
    redis: "ok",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    checks.database = "error";
  }

  try {
    const redis = await getRedis();
    await redis.ping();
  } catch {
    checks.redis = "error";
  }

  const healthy = Object.values(checks).every((status) => status === "ok");

  // 依赖异常时返回 503，方便负载均衡和部署探针识别故障。
  return NextResponse.json(
    {
      status: healthy ? "ok" : "error",
      checks,
    },
    {
      status: healthy ? 200 : 503,
    }
  );
}
