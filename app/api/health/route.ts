import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

export async function GET() {
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
