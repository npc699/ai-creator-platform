import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateCompliantContent,
  hashReviewContent,
} from "@/lib/review";
import { reviewFixRequestSchema } from "@/lib/review/schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录后再生成合规版本" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsed = reviewFixRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "合规改写参数无效" },
      { status: 400 }
    );
  }

  try {
    const fixed = await generateCompliantContent(parsed.data);

    await prisma.reviewRecord.create({
      data: {
        userId: user.id,
        reviewType: "FIX",
        contentHash: hashReviewContent(parsed.data.title, parsed.data.content),
        passed: true,
        riskLevel: "NONE",
        categories: parsed.data.categories,
        qualityScore: null,
        result: {
          sourceReason: parsed.data.reason,
          sourceCategories: parsed.data.categories,
          fixed,
        },
      },
    });

    return NextResponse.json({ fixed });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "合规版本生成失败，请稍后重试";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
