import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { buildHomeQuery, parseFeedChannel, parseFeedSort } from "@/lib/feed/params";
import { fetchHomeFeedPage } from "@/lib/feed/home/query";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channel = parseFeedChannel(searchParams.get("channel"));
  const sort = parseFeedSort(searchParams.get("sort"));
  const topic = searchParams.get("topic")?.trim() || null;
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  const homeReturnPath =
    searchParams.get("returnPath")?.trim() ||
    buildHomeQuery({
      channel,
      sort,
      topic: topic ?? undefined,
    });

  const user = await getCurrentUser();

  const result = await fetchHomeFeedPage({
    channel,
    sort,
    topic,
    userId: user?.id,
    homeReturnPath,
    cursor,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return NextResponse.json(result);
}
