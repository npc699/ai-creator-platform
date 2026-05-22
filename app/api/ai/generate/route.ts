import { NextResponse } from "next/server";

import {
  ArkConfigError,
  buildAiMessages,
  aiGenerateRequestSchema,
  streamArkChat,
} from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

type AiStreamEvent =
  | {
      type: "delta";
      text: string;
    }
  | {
      type: "done";
    }
  | {
      type: "error";
      message: string;
    };

const encoder = new TextEncoder();

function encodeStreamEvent(event: AiStreamEvent) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

function getErrorMessage(error: unknown) {
  if (error instanceof ArkConfigError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message || "AI 生成失败，请稍后重试";
  }

  return "AI 生成失败，请稍后重试";
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function closeStream(controller: ReadableStreamDefaultController<Uint8Array>) {
  try {
    controller.close();
  } catch {
    // 客户端主动中断时流可能已关闭，此处静默收尾即可。
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "请先登录后再使用 AI 生成" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式无效" }, { status: 400 });
  }

  const parsedBody = aiGenerateRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: parsedBody.error.issues[0]?.message ?? "AI 生成参数无效",
      },
      { status: 400 }
    );
  }

  const messages = buildAiMessages(parsedBody.data);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // 流式响应一旦开始就无法再改 HTTP 状态，因此上游失败统一写入 error 事件。
        for await (const text of streamArkChat({
          messages,
          signal: request.signal,
        })) {
          controller.enqueue(encodeStreamEvent({ type: "delta", text }));
        }

        controller.enqueue(encodeStreamEvent({ type: "done" }));
      } catch (error) {
        if (!request.signal.aborted && !isAbortError(error)) {
          controller.enqueue(
            encodeStreamEvent({
              type: "error",
              message: getErrorMessage(error),
            })
          );
        }
      } finally {
        closeStream(controller);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
