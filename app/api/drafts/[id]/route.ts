import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { draftUpdateSchema } from "@/lib/validations/draft";

export const runtime = "nodejs";

// 集中处理鉴权 + 所有权校验，避免 GET/PUT 重复实现失败分支。
async function loadOwnedDraft(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "请先登录" }, { status: 401 }) } as const;
  }

  const draft = await prisma.draft.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      content: true,
      updatedAt: true,
      promptId: true,
    },
  });

  if (!draft) {
    return { error: NextResponse.json({ error: "草稿不存在" }, { status: 404 }) } as const;
  }

  if (draft.userId !== user.id) {
    // 不暴露存在性：跨账号访问视为禁止，统一返 403。
    return { error: NextResponse.json({ error: "无权访问该草稿" }, { status: 403 }) } as const;
  }

  return { user, draft } as const;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/drafts/[id]">
) {
  const { id } = await context.params;
  const result = await loadOwnedDraft(id);
  if ("error" in result) {
    return result.error;
  }

  const { draft } = result;
  return NextResponse.json({
    draft: {
      id: draft.id,
      title: draft.title,
      content: draft.content,
      promptId: draft.promptId,
      updatedAt: draft.updatedAt,
    },
  });
}

export async function PUT(
  request: NextRequest,
  context: RouteContext<"/api/drafts/[id]">
) {
  const { id } = await context.params;
  const result = await loadOwnedDraft(id);
  if ("error" in result) {
    return result.error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsed = draftUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "草稿参数无效" },
      { status: 400 }
    );
  }

  const { title, content, promptId } = parsed.data;

  const updated = await prisma.draft.update({
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

  return NextResponse.json({ draft: updated });
}
