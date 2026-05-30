import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";

const editDraftSelect = {
  id: true,
  title: true,
  content: true,
  tags: true,
  coverUrl: true,
  promptId: true,
  updatedAt: true,
} as const;

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

/** 查找或创建某篇已发布文章的 EditDraft（待审编辑层）。 */
export async function findOrCreateEditDraft(postId: string, userId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true,
      title: true,
      content: true,
      tags: true,
      coverUrl: true,
      promptId: true,
    },
  });

  if (!post) {
    return { error: "NOT_FOUND" as const };
  }

  if (post.userId !== userId) {
    return { error: "FORBIDDEN" as const };
  }

  const existing = await prisma.draft.findUnique({
    where: { sourcePostId: postId },
    select: editDraftSelect,
  });

  if (existing) {
    return { post, draft: existing };
  }

  try {
    const created = await prisma.draft.create({
      data: {
        userId,
        sourcePostId: postId,
        title: post.title,
        content: post.content,
        tags: post.tags,
        coverUrl: post.coverUrl,
        promptId: post.promptId,
      },
      select: editDraftSelect,
    });

    return { post, draft: created };
  } catch (error) {
    // 并发 create 时后者会 P2002；对方事务可能尚未提交，需短暂重试回读
    if (isUniqueConstraintError(error)) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const raced = await prisma.draft.findUnique({
          where: { sourcePostId: postId },
          select: editDraftSelect,
        });
        if (raced) {
          return { post, draft: raced };
        }
        await new Promise((resolve) => setTimeout(resolve, 30 * (attempt + 1)));
      }
    }

    throw error;
  }
}
