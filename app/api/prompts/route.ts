import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugToPrismaCategory } from "@/lib/prompts/category";
import { buildPromptListWhere, promptListInclude } from "@/lib/prompts/list";
import { serializePrompt, serializePromptList } from "@/lib/prompts/serialize";
import type { EditorPromptScope } from "@/lib/prompts/query";
import { promptCreateSchema } from "@/lib/validations/prompt";

export const runtime = "nodejs";

const MAX_PROMPTS_LIST = 100;

function parseEditorListScope(value: string | null): EditorPromptScope {
  return value === "favorite" ? "favorite" : "mine";
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = parseEditorListScope(searchParams.get("scope"));

  const prompts = await prisma.prompt.findMany({
    where: buildPromptListWhere(user.id, scope, "all"),
    include: promptListInclude(user.id),
    orderBy: { updatedAt: "desc" },
    take: MAX_PROMPTS_LIST,
  });

  return NextResponse.json({
    prompts: serializePromptList(prompts),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再创建 Prompt" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsed = promptCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Prompt 参数无效" },
      { status: 400 }
    );
  }

  const { title, content, category } = parsed.data;

  const prompt = await prisma.prompt.create({
    data: {
      userId: user.id,
      title,
      content,
      category: slugToPrismaCategory(category),
      isOfficial: false,
    },
  });

  return NextResponse.json({ prompt: serializePrompt(prompt) });
}
