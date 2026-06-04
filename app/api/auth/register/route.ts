// 公开注册接口：校验并写库，不建立会话；客户端注册成功后需再调 signIn 获取 Cookie。
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { registerSchema } from "@/lib/auth";
import { prisma } from "@/lib/db";

// bcrypt 与 Prisma 依赖 Node 内置能力，不可放在 Edge 运行时。
export const runtime = "nodejs";

/** 创建用户账号；邮箱/手机号唯一性冲突返回 409，成功返回 201 与公开字段（不含 passwordHash）。 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsedBody = registerSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: parsedBody.error.issues[0]?.message ?? "注册信息无效",
      },
      { status: 400 }
    );
  }

  const { email, name, password, phone } = parsedBody.data;

  // 分字段查重以便返回具体文案；schema 已保证至少填 email 或 phone 之一。
  if (email) {
    const existingEmailUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmailUser) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }
  }

  if (phone) {
    const existingPhoneUser = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });

    if (existingPhoneUser) {
      return NextResponse.json({ error: "该手机号已注册" }, { status: 409 });
    }
  }

  // cost 12 与常见凭据存储实践一致，在安全性与注册耗时之间折中。
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email: email ?? null,
      phone: phone ?? null,
      name,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      image: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
