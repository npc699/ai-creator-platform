import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { recordPostView } from "@/lib/posts/metrics";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/posts/[id]/view">
) {
  const { id } = await context.params;
  const user = await getCurrentUser();

  const result = await recordPostView(id, user?.id ?? null);

  if (!result.ok) {
    return NextResponse.json({ error: "文章不存在或未上线" }, { status: result.status });
  }

  return NextResponse.json({
    recorded: result.recorded,
    viewCount: result.viewCount,
  });
}
