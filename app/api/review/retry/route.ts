import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildReviewRecordResult,
  reviewContent,
  toPrismaReviewRiskLevel,
} from "@/lib/review";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const postId =
    body && typeof body === "object" && "postId" in body
      ? (body as { postId: unknown }).postId
      : null;

  if (typeof postId !== "string" || postId.trim().length === 0) {
    return NextResponse.json({ error: "缺少文章 ID" }, { status: 400 });
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      userId: true,
      title: true,
      content: true,
      reviewStatus: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  if (post.userId !== user.id) {
    return NextResponse.json({ error: "无权操作该文章" }, { status: 403 });
  }

  // 仅 PENDING 状态允许重试，已完成审核的文章不允许反复重试。
  if (post.reviewStatus !== "PENDING") {
    return NextResponse.json(
      { error: "该文章已完成审核，无需重试" },
      { status: 409 }
    );
  }

  const reviewResult = await reviewContent({
    title: post.title,
    content: post.content,
    postId,
    userId: user.id,
    reviewType: "MANUAL",
  });

  if (reviewResult.aiFailed) {
    await prisma.reviewRecord.create({
      data: {
        postId,
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

    return NextResponse.json({ retryStatus: "still_pending", reviewResult });
  }

  await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: { id: postId },
      data: {
        qualityScore: reviewResult.qualityScore,
        reviewStatus: reviewResult.status,
        reviewRiskLevel: toPrismaReviewRiskLevel(reviewResult.safety.riskLevel),
        reviewedAt: new Date(),
      },
    });

    await tx.reviewRecord.create({
      data: {
        postId,
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
  });

  return NextResponse.json({ retryStatus: "completed", reviewResult });
}
