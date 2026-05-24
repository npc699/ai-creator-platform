import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { slugToPrismaCategory } from "@/lib/prompts/category";
import { promptListInclude } from "@/lib/prompts/list";
import {
  loadAccessiblePrompt,
  loadOwnedPrompt,
  setOfficialPromptFavorite,
} from "@/lib/prompts/ownership";
import { serializePrompt } from "@/lib/prompts/serialize";
import { prisma } from "@/lib/db";
import { promptUpdateSchema } from "@/lib/validations/prompt";

export const runtime = "nodejs";

async function serializePromptForUser(promptId: string, userId: string) {
  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    include: promptListInclude(userId),
  });

  if (!prompt) {
    return null;
  }

  return serializePrompt(prompt);
}

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/prompts/[id]">
) {
  const { id } = await context.params;
  const result = await loadAccessiblePrompt(id);
  if ("error" in result) {
    return result.error;
  }

  const serialized = await serializePromptForUser(id, result.user.id);
  if (!serialized) {
    return NextResponse.json({ error: "Prompt 不存在" }, { status: 404 });
  }

  return NextResponse.json({ prompt: serialized });
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/prompts/[id]">
) {
  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsed = promptUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Prompt 参数无效" },
      { status: 400 }
    );
  }

  const { title, content, category, isFavorite } = parsed.data;

  // 官方 Prompt 仅允许切换收藏，内容不可改。
  if (isFavorite !== undefined && title === undefined && content === undefined && category === undefined) {
    const access = await loadAccessiblePrompt(id);
    if ("error" in access) {
      return access.error;
    }

    const { user, prompt } = access;
    if (!prompt.isOfficial) {
      const owned = await loadOwnedPrompt(id);
      if ("error" in owned) {
        return owned.error;
      }

      const updated = await prisma.prompt.update({
        where: { id },
        data: { isFavorite },
      });

      return NextResponse.json({ prompt: serializePrompt(updated) });
    }

    await setOfficialPromptFavorite(user.id, id, isFavorite);
    const serialized = await serializePromptForUser(id, user.id);
    return NextResponse.json({ prompt: serialized });
  }

  const result = await loadOwnedPrompt(id);
  if ("error" in result) {
    return result.error;
  }

  if (
    title === undefined &&
    content === undefined &&
    category === undefined &&
    isFavorite === undefined
  ) {
    return NextResponse.json({ error: "没有可更新的字段" }, { status: 400 });
  }

  const updated = await prisma.prompt.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(category !== undefined
        ? { category: slugToPrismaCategory(category) }
        : {}),
      ...(isFavorite !== undefined ? { isFavorite } : {}),
    },
  });

  return NextResponse.json({ prompt: serializePrompt(updated) });
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext<"/api/prompts/[id]">
) {
  const { id } = await context.params;
  const result = await loadOwnedPrompt(id);
  if ("error" in result) {
    return result.error;
  }

  await prisma.prompt.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
