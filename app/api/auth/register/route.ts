import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { registerSchema } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

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
