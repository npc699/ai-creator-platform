import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { unpublishedDraftWhere } from "@/lib/drafts/query";

export const runtime = "nodejs";

// 进入编辑器时自动恢复"最近一条草稿"的唯一数据来源；找不到返回 null 而非 404，便于前端区分未登录与无草稿。
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const draft = await prisma.draft.findFirst({
    where: { userId: user.id, ...unpublishedDraftWhere },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      promptId: true,
      coverUrl: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ draft });
}
