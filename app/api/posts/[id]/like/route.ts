import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { togglePostLike } from "@/lib/posts/metrics";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/posts/[id]/like">
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再点赞" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await togglePostLike(id, user.id);

  if (!result.ok) {
    return NextResponse.json({ error: "文章不存在或未上线" }, { status: result.status });
  }

  return NextResponse.json({
    liked: result.liked,
    likeCount: result.likeCount,
  });
}
