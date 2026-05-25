import "server-only";

import { cookies } from "next/headers";

import { prisma } from "@/lib/db";
import { PostStatus } from "@/lib/generated/prisma/client";

const VIEWER_COOKIE = "viewer_id";
const VIEWER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type ReadablePost = {
  id: string;
  userId: string;
  status: PostStatus;
  viewCount: number;
};

async function loadPublishedPost(postId: string): Promise<ReadablePost | null> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true,
      status: true,
      viewCount: true,
    },
  });

  if (!post || post.status !== PostStatus.PUBLISHED) {
    return null;
  }

  return post;
}

/** 读取或生成匿名访客标识，用于未登录用户的阅读去重。 */
export async function getOrCreateViewerKey(userId: string | null) {
  if (userId) {
    return userId;
  }

  const cookieStore = await cookies();
  const existing = cookieStore.get(VIEWER_COOKIE)?.value;
  if (existing) {
    return existing;
  }

  const viewerKey = crypto.randomUUID();
  cookieStore.set(VIEWER_COOKIE, viewerKey, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: VIEWER_COOKIE_MAX_AGE,
    path: "/",
  });

  return viewerKey;
}

/** 记录一次有效阅读：作者本人不计入，同一 viewerKey 仅计一次。 */
export async function recordPostView(postId: string, viewerUserId: string | null) {
  const post = await loadPublishedPost(postId);
  if (!post) {
    return { ok: false as const, status: 404 as const };
  }

  // 作者预览自己的文章不计入阅读量。
  if (viewerUserId && viewerUserId === post.userId) {
    return {
      ok: true as const,
      recorded: false,
      viewCount: post.viewCount,
    };
  }

  const viewerKey = await getOrCreateViewerKey(viewerUserId);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.postView.create({
        data: {
          postId,
          viewerKey,
          userId: viewerUserId,
        },
      });

      return tx.post.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });
    });

    return {
      ok: true as const,
      recorded: true,
      viewCount: updated.viewCount,
    };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : null;

    if (code === "P2002") {
      return {
        ok: true as const,
        recorded: false,
        viewCount: post.viewCount,
      };
    }

    throw error;
  }
}

/** 批量查询当前用户已点赞的文章 id。 */
export async function getLikedPostIds(userId: string, postIds: string[]) {
  if (postIds.length === 0) {
    return new Set<string>();
  }

  const likes = await prisma.postLike.findMany({
    where: {
      userId,
      postId: { in: postIds },
    },
    select: { postId: true },
  });

  return new Set(likes.map((like) => like.postId));
}

/** 切换点赞状态，同步维护 Post.likeCount。 */
export async function togglePostLike(postId: string, userId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      status: true,
      likeCount: true,
    },
  });

  if (!post || post.status !== PostStatus.PUBLISHED) {
    return { ok: false as const, status: 404 as const };
  }

  const existing = await prisma.postLike.findUnique({
    where: {
      postId_userId: {
        postId,
        userId,
      },
    },
    select: { postId: true },
  });

  if (existing) {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      return tx.post.update({
        where: { id: postId },
        data: {
          likeCount: post.likeCount > 0 ? { decrement: 1 } : undefined,
        },
        select: { likeCount: true },
      });
    });

    return {
      ok: true as const,
      liked: false,
      likeCount: updated.likeCount,
    };
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.postLike.create({
      data: {
        postId,
        userId,
      },
    });

    return tx.post.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    });
  });

  return {
    ok: true as const,
    liked: true,
    likeCount: updated.likeCount,
  };
}
