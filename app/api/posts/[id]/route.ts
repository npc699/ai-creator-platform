import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PostStatus } from "@/lib/generated/prisma/client";
import { assertOwnedPromptId } from "@/lib/prompts/ownership";
import {
  buildReviewRecordResult,
  hashReviewContent,
  reviewContent,
  toPrismaReviewRiskLevel,
} from "@/lib/review";
import {
  postStatusPatchSchema,
  postUpdateSchema,
} from "@/lib/validations/post";

export const runtime = "nodejs";

async function loadOwnedPost(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "请先登录" }, { status: 401 }) } as const;
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      content: true,
      status: true,
      qualityScore: true,
      reviewStatus: true,
      reviewRiskLevel: true,
      reviewedAt: true,
      publishedAt: true,
      updatedAt: true,
      promptId: true,
      tags: true,
    },
  });

  if (!post) {
    return { error: NextResponse.json({ error: "文章不存在" }, { status: 404 }) } as const;
  }

  if (post.userId !== user.id) {
    return { error: NextResponse.json({ error: "无权访问该文章" }, { status: 403 }) } as const;
  }

  return { user, post } as const;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/posts/[id]">
) {
  const { id } = await context.params;
  const result = await loadOwnedPost(id);
  if ("error" in result) {
    return result.error;
  }

  const { post } = result;
  return NextResponse.json({
    post: {
      id: post.id,
      title: post.title,
      content: post.content,
      status: post.status,
      qualityScore: post.qualityScore,
      reviewStatus: post.reviewStatus,
      reviewRiskLevel: post.reviewRiskLevel,
      reviewedAt: post.reviewedAt,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      promptId: post.promptId,
      tags: post.tags,
    },
  });
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/posts/[id]">
) {
  const { id } = await context.params;
  const result = await loadOwnedPost(id);
  if ("error" in result) {
    return result.error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsed = postUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "文章参数无效" },
      { status: 400 }
    );
  }

  const { promptId } = parsed.data;

  const promptError = await assertOwnedPromptId(result.user.id, promptId);
  if (promptError) {
    return promptError;
  }

  // 已发布文章的正文/标签修改须走 EditDraft + publish-update，禁止直写 Post。
  if (result.post.status === PostStatus.PUBLISHED || result.post.status === PostStatus.ARCHIVED) {
    return NextResponse.json(
      {
        error:
          "已发布文章请通过编辑器修改并点击「更新发布」，内容将经审核后再上线",
      },
      { status: 400 }
    );
  }

  const updated = await prisma.post.update({
    where: { id },
    data: {
      promptId: promptId ?? null,
    },
    select: {
      id: true,
      updatedAt: true,
      qualityScore: true,
      reviewStatus: true,
      reviewRiskLevel: true,
    },
  });

  return NextResponse.json({ post: updated });
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/posts/[id]">
) {
  const { id } = await context.params;
  const result = await loadOwnedPost(id);
  if ("error" in result) {
    return result.error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsed = postStatusPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "状态参数无效" },
      { status: 400 }
    );
  }

  const { status } = parsed.data;
  const { post } = result;

  const shouldReviewBeforePublish =
    status === PostStatus.PUBLISHED && post.status !== PostStatus.PUBLISHED;
  const currentContentHash = hashReviewContent(post.title, post.content, post.tags);
  const latestReview = shouldReviewBeforePublish
    ? await prisma.reviewRecord.findFirst({
        where: { postId: id },
        orderBy: { createdAt: "desc" },
        select: { contentHash: true, riskLevel: true },
      })
    : null;
  const needsReview =
    shouldReviewBeforePublish &&
    (!latestReview ||
      latestReview.contentHash !== currentContentHash ||
      latestReview.riskLevel === "HIGH");
  const reviewResult = needsReview
    ? await reviewContent({
        title: post.title,
        content: post.content,
        tags: post.tags,
        postId: id,
        userId: result.user.id,
        reviewType: "UPDATE",
      })
    : null;

  if (reviewResult?.status === "REJECTED") {
    await prisma.reviewRecord.create({
      data: {
        postId: id,
        userId: result.user.id,
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
      where: { id },
      data: {
        status,
        publishedAt:
          status === PostStatus.PUBLISHED
            ? (post.publishedAt ?? new Date())
            : post.publishedAt,
        ...(reviewResult
          ? {
              qualityScore: reviewResult.qualityScore,
              reviewStatus: reviewResult.status,
              reviewRiskLevel: toPrismaReviewRiskLevel(reviewResult.safety.riskLevel),
              reviewedAt: reviewResult.aiFailed ? null : new Date(),
            }
          : {}),
      },
      select: {
        id: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        qualityScore: true,
        reviewStatus: true,
        reviewRiskLevel: true,
      },
    });

    if (reviewResult) {
      await tx.reviewRecord.create({
        data: {
          postId: id,
          userId: result.user.id,
          reviewType: "UPDATE",
          contentHash: reviewResult.contentHash,
          passed: reviewResult.safety.passed,
          riskLevel: toPrismaReviewRiskLevel(reviewResult.safety.riskLevel),
          categories: reviewResult.safety.categories,
          qualityScore: reviewResult.qualityScore,
          result: buildReviewRecordResult(reviewResult),
        },
      });
    }

    return updatedPost;
  });

  return NextResponse.json({ post: updated, reviewResult });
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/posts/[id]">
) {
  const { id } = await context.params;
  const result = await loadOwnedPost(id);
  if ("error" in result) {
    return result.error;
  }

  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
