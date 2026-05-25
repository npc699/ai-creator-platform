import { NextResponse } from "next/server";

import {
  ArkConfigError,
  ArkUpstreamError,
  aiImageRequestSchema,
  generateArkImage,
} from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function getErrorMessage(error: unknown) {
  if (error instanceof ArkConfigError) {
    return error.message;
  }

  if (error instanceof ArkUpstreamError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message || "AI 生图失败，请稍后重试";
  }

  return "AI 生图失败，请稍后重试";
}

function getErrorStatus(error: unknown) {
  if (error instanceof ArkConfigError) {
    return 503;
  }

  if (error instanceof ArkUpstreamError) {
    if (error.status >= 400 && error.status < 500) {
      return 502;
    }

    return error.status >= 500 ? error.status : 502;
  }

  return 502;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录后再使用 AI 生图" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsedBody = aiImageRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: parsedBody.error.issues[0]?.message ?? "AI 生图参数无效",
      },
      { status: 400 }
    );
  }

  try {
    const result = await generateArkImage({
      prompt: parsedBody.data.prompt,
      size: parsedBody.data.size,
      signal: request.signal,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (isAbortError(error) || request.signal.aborted) {
      return NextResponse.json({ error: "请求已取消" }, { status: 499 });
    }

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: getErrorStatus(error) }
    );
  }
}
