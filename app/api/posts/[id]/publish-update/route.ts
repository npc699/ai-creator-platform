import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  buildReviewRecordResult,
  reviewContent,
  toPrismaReviewRiskLevel,
} from "@/lib/review";

export const runtime = "nodejs";

export async function POST(
  _request: NextRequest,
  context: RouteContext<"/api/posts/[id]/publish-update">
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id: postId } = await context.params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, userId: true },
  });

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  if (post.userId !== user.id) {
    return NextResponse.json({ error: "无权更新该文章" }, { status: 403 });
  }

  const editDraft = await prisma.draft.findUnique({
    where: { sourcePostId: postId },
    select: {
      id: true,
      title: true,
      content: true,
      tags: true,
      promptId: true,
    },
  });

  if (!editDraft) {
    return NextResponse.json({ error: "没有待发布的编辑内容" }, { status: 400 });
  }

  const reviewResult = await reviewContent({
    title: editDraft.title,
    content: editDraft.content,
    tags: editDraft.tags,
    postId,
    draftId: editDraft.id,
    userId: user.id,
    reviewType: "UPDATE",
  });

  if (reviewResult.status === "REJECTED") {
    await prisma.reviewRecord.create({
      data: {
        postId,
        draftId: editDraft.id,
        userId: user.id,
        reviewType: "UPDATE",
        contentHash: reviewResult.contentHash,
        passed: reviewResult.safety.passed,
        riskLevel: toPrismaReviewRiskLevel(reviewResult.safety.riskLevel),
        categories: reviewResult.safety.categories,
        qualityScore: reviewResult.qualityScore,
        result: buildReviewRecordResult(reviewResult),
      },
    });

    return NextResponse.json(
      { error: reviewResult.safety.reason, reviewResult },
      { status: 422 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedPost = await tx.post.update({
      where: { id: postId },
      data: {
        title: editDraft.title,
        content: editDraft.content,
        tags: editDraft.tags,
        promptId: editDraft.promptId,
        qualityScore: reviewResult.qualityScore,
        reviewStatus: reviewResult.status,
        reviewRiskLevel: toPrismaReviewRiskLevel(reviewResult.safety.riskLevel),
        reviewedAt: reviewResult.aiFailed ? null : new Date(),
      },
      select: {
        id: true,
        updatedAt: true,
        qualityScore: true,
        reviewStatus: true,
        reviewRiskLevel: true,
      },
    });

    await tx.reviewRecord.create({
      data: {
        postId,
        draftId: editDraft.id,
        userId: user.id,
        reviewType: "UPDATE",
        contentHash: reviewResult.contentHash,
        passed: reviewResult.safety.passed,
        riskLevel: toPrismaReviewRiskLevel(reviewResult.safety.riskLevel),
        categories: reviewResult.safety.categories,
        qualityScore: reviewResult.qualityScore,
        result: buildReviewRecordResult(reviewResult),
      },
    });

    await tx.draft.delete({ where: { id: editDraft.id } });

    return updatedPost;
  });

  return NextResponse.json({ post: updated, reviewResult });
}
