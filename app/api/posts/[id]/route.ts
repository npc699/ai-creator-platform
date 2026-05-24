import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PostStatus } from "@/lib/generated/prisma/client";
import { assertOwnedPromptId } from "@/lib/prompts/ownership";
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
      publishedAt: true,
      updatedAt: true,
      promptId: true,
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
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
      promptId: post.promptId,
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

  const { title, content, promptId } = parsed.data;

  const promptError = await assertOwnedPromptId(result.user.id, promptId);
  if (promptError) {
    return promptError;
  }

  const updated = await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      promptId: promptId ?? null,
    },
    select: {
      id: true,
      updatedAt: true,
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

  const updated = await prisma.post.update({
    where: { id },
    data: {
      status,
      publishedAt:
        status === PostStatus.PUBLISHED
          ? (post.publishedAt ?? new Date())
          : post.publishedAt,
    },
    select: {
      id: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ post: updated });
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
