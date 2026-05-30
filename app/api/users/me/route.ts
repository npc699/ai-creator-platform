import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userProfileUpdateSchema } from "@/lib/validations/user-profile";

export const runtime = "nodejs";

/** 更新当前登录用户的公开资料（昵称、简介）。 */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  const parsed = userProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数无效" },
      { status: 400 }
    );
  }

  const data: { name?: string | null; bio?: string | null } = {};
  if (parsed.data.name !== undefined) {
    data.name = parsed.data.name;
  }
  if (parsed.data.bio !== undefined) {
    data.bio = parsed.data.bio;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "没有可更新的字段" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      id: true,
      name: true,
      bio: true,
      image: true,
    },
  });

  return NextResponse.json({ user: updated });
}
