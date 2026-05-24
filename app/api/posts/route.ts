import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildPostExcerpt } from "@/lib/posts/excerpt";
import { postPublishSchema } from "@/lib/validations/post";
import { PostStatus } from "@/lib/generated/prisma/client";

export const runtime = "nodejs";

const MAX_POSTS_LIST = 100;

const LISTABLE_STATUSES = new Set<PostStatus>([
  PostStatus.PUBLISHED,
  PostStatus.DRAFT,
  PostStatus.ARCHIVED,
]);

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") ?? PostStatus.PUBLISHED;
  const status = LISTABLE_STATUSES.has(statusParam as PostStatus)
    ? (statusParam as PostStatus)
    : PostStatus.PUBLISHED;

  const posts = await prisma.post.findMany({
    where: {
      userId: user.id,
      status,
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: MAX_POSTS_LIST,
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      excerpt: buildPostExcerpt(post.content),
      status: post.status,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再发布" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsed = postPublishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "发布参数无效" },
      { status: 400 }
    );
  }

  const { title, content, draftId, promptId } = parsed.data;

  try {
    const post = await prisma.$transaction(async (tx) => {
      if (draftId) {
        const draft = await tx.draft.findUnique({
          where: { id: draftId },
          select: { id: true, userId: true, post: { select: { id: true } } },
        });

        if (!draft || draft.userId !== user.id) {
          throw new Error("DRAFT_FORBIDDEN");
        }

        if (draft.post) {
          throw new Error("DRAFT_ALREADY_PUBLISHED");
        }
      }

      const created = await tx.post.create({
        data: {
          userId: user.id,
          title,
          content,
          status: "PUBLISHED",
          publishedAt: new Date(),
          draftId: draftId ?? null,
          promptId: promptId ?? null,
        },
        select: {
          id: true,
          title: true,
          updatedAt: true,
          publishedAt: true,
        },
      });

      // 发布后删除源草稿，避免草稿箱仍显示已发布内容（Post.draftId 由 FK onDelete SetNull 自动清空）。
      if (draftId) {
        await tx.draft.delete({ where: { id: draftId } });
      }

      return created;
    });

    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DRAFT_FORBIDDEN") {
        return NextResponse.json({ error: "无权使用该草稿发布" }, { status: 403 });
      }
      if (error.message === "DRAFT_ALREADY_PUBLISHED") {
        return NextResponse.json({ error: "该草稿已发布" }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "发布失败，请稍后重试" }, { status: 500 });
  }
}
