import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { findOrCreateEditDraft } from "@/lib/drafts/edit-draft";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/posts/[id]/edit">
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await findOrCreateEditDraft(id, user.id);

  if ("error" in result) {
    if (result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "无权编辑该文章" }, { status: 403 });
  }

  const { post, draft } = result;

  return NextResponse.json({
    draftId: draft.id,
    postId: post.id,
    source: "edit" as const,
    title: draft.title,
    content: draft.content,
    tags: draft.tags,
    promptId: draft.promptId,
    updatedAt: draft.updatedAt,
  });
}
