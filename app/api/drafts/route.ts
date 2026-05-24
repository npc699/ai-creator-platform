import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildDraftListWhere } from "@/lib/drafts/query";
import { draftCreateSchema } from "@/lib/validations/draft";

export const runtime = "nodejs";

const MAX_DRAFTS_LIST = 100;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const drafts = await prisma.draft.findMany({
    where: buildDraftListWhere(user.id),
    orderBy: { updatedAt: "desc" },
    take: MAX_DRAFTS_LIST,
    select: {
      id: true,
      title: true,
      content: true,
      updatedAt: true,
      prompt: { select: { title: true } },
    },
  });

  return NextResponse.json({ drafts });
}

export async function POST(request: Request) {
  // 信任边界：所有写操作必须先校验登录态。
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再保存草稿" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsed = draftCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "草稿参数无效" },
      { status: 400 }
    );
  }

  const { title, content, promptId } = parsed.data;

  const draft = await prisma.draft.create({
    data: {
      userId: user.id,
      title,
      content,
      promptId: promptId ?? null,
    },
    select: {
      id: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ draft });
}
