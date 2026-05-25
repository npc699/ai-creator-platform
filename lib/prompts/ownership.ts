import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** 加载当前用户可访问的 Prompt（自有或官方），用于查看与使用。 */
export async function loadAccessiblePrompt(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "请先登录" }, { status: 401 }) } as const;
  }

  const prompt = await prisma.prompt.findUnique({ where: { id } });
  if (!prompt) {
    return { error: NextResponse.json({ error: "Prompt 不存在" }, { status: 404 }) } as const;
  }

  if (!prompt.isOfficial && prompt.userId !== user.id) {
    return { error: NextResponse.json({ error: "无权访问该 Prompt" }, { status: 403 }) } as const;
  }

  return { user, prompt } as const;
}

/** 加载当前用户拥有的非官方 Prompt，用于编辑与删除。 */
export async function loadOwnedPrompt(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "请先登录" }, { status: 401 }) } as const;
  }

  const prompt = await prisma.prompt.findUnique({ where: { id } });
  if (!prompt) {
    return { error: NextResponse.json({ error: "Prompt 不存在" }, { status: 404 }) } as const;
  }

  if (prompt.isOfficial || prompt.userId !== user.id) {
    return { error: NextResponse.json({ error: "无权修改该 Prompt" }, { status: 403 }) } as const;
  }

  return { user, prompt } as const;
}

/** 校验 promptId 是否可用：属于当前用户或为官方 Prompt。 */
export async function assertOwnedPromptId(userId: string, promptId: string | null | undefined) {
  if (!promptId) {
    return null;
  }

  const prompt = await prisma.prompt.findFirst({
    where: {
      id: promptId,
      OR: [{ userId }, { isOfficial: true }],
    },
    select: { id: true },
  });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt 不存在或无权使用" }, { status: 400 });
  }

  return null;
}

/** 切换用户对官方 Prompt 的收藏状态。 */
export async function setOfficialPromptFavorite(
  userId: string,
  promptId: string,
  isFavorite: boolean
) {
  if (isFavorite) {
    await prisma.promptFavorite.upsert({
      where: {
        userId_promptId: { userId, promptId },
      },
      update: {},
      create: { userId, promptId },
    });
    return;
  }

  await prisma.promptFavorite.deleteMany({
    where: { userId, promptId },
  });
}
