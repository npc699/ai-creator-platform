import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { postId } = await context.params;
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  if (post.userId !== user.id) {
    return NextResponse.json({ error: "无权查看该文章审核记录" }, { status: 403 });
  }

  const records = await prisma.reviewRecord.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      reviewType: true,
      contentHash: true,
      passed: true,
      riskLevel: true,
      categories: true,
      qualityScore: true,
      result: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ records });
}
