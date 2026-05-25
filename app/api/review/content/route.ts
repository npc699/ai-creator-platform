import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildReviewRecordResult,
  reviewContent,
  toPrismaReviewRiskLevel,
} from "@/lib/review";
import { reviewContentRequestSchema } from "@/lib/review/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再审核内容" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsed = reviewContentRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "审核参数无效" },
      { status: 400 }
    );
  }

  const { postId, draftId, title, content, tags: requestTags } = parsed.data;

  let postTags: string[] = [];
  if (postId) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true, tags: true },
    });
    if (!post || post.userId !== user.id) {
      return NextResponse.json({ error: "无权审核该文章" }, { status: 403 });
    }
    postTags = post.tags;
  }

  // 请求体中的 tags 优先于 post 已有 tags（预审核场景下标签尚未保存到 post）
  const reviewTags = requestTags ?? postTags;

  if (draftId) {
    const draft = await prisma.draft.findUnique({
      where: { id: draftId },
      select: { userId: true },
    });
    if (!draft || draft.userId !== user.id) {
      return NextResponse.json({ error: "无权审核该草稿" }, { status: 403 });
    }
  }

  const reviewResult = await reviewContent({
    title,
    content,
    tags: reviewTags,
    postId,
    draftId,
    userId: user.id,
    reviewType: "MANUAL",
  });

  await prisma.reviewRecord.create({
    data: {
      postId: postId ?? null,
      draftId: draftId ?? null,
      userId: user.id,
      reviewType: "MANUAL",
      contentHash: reviewResult.contentHash,
      passed: reviewResult.safety.passed,
      riskLevel: toPrismaReviewRiskLevel(reviewResult.safety.riskLevel),
      categories: reviewResult.safety.categories,
      qualityScore: reviewResult.qualityScore,
      result: buildReviewRecordResult(reviewResult),
    },
  });

  return NextResponse.json({ reviewResult });
}
