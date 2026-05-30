import { NextResponse } from "next/server";

import { refreshFeedScores } from "@/lib/feed/refresh-scores";

export const runtime = "nodejs";

/** 定时刷新热点/爆文预计算分；由 Vercel Cron 或外部调度携带 CRON_SECRET 调用。 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
  }

  const result = await refreshFeedScores();
  return NextResponse.json({ ok: true, ...result });
}
