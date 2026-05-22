import "server-only";

const DEFAULT_ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

export type ArkChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ArkStreamOptions = {
  messages: ArkChatMessage[];
  signal?: AbortSignal;
};

type ArkChatCompletionChunk = {
  choices?: Array<{
    delta?: {
      content?: string | null;
    };
  }>;
};

export class ArkConfigError extends Error {
  readonly code = "ARK_CONFIG_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ArkConfigError";
  }
}

export class ArkUpstreamError extends Error {
  readonly code = "ARK_UPSTREAM_ERROR";
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ArkUpstreamError";
    this.status = status;
  }
}

function getArkConfig() {
  const apiKey = process.env.ARK_API_KEY?.trim();
  const baseUrl = (process.env.ARK_BASE_URL?.trim() || DEFAULT_ARK_BASE_URL).replace(
    /\/$/,
    ""
  );
  const model = process.env.ARK_MODEL?.trim();

  if (!apiKey) {
    throw new ArkConfigError("未配置 ARK_API_KEY，无法调用火山方舟");
  }

  if (!model) {
    throw new ArkConfigError("未配置 ARK_MODEL（推理接入点 ID），无法调用火山方舟");
  }

  return { apiKey, baseUrl, model };
}

function extractDeltaText(chunk: ArkChatCompletionChunk) {
  const content = chunk.choices?.[0]?.delta?.content;
  return typeof content === "string" && content.length > 0 ? content : null;
}

/**
 * 调用火山方舟 Chat Completions 并以异步生成器逐段产出文本 delta。
 * 上游协议为 OpenAI 兼容 SSE（data: {...} / data: [DONE]）。
 */
export async function* streamArkChat({
  messages,
  signal,
}: ArkStreamOptions): AsyncGenerator<string, void, unknown> {
  const { apiKey, baseUrl, model } = getArkConfig();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    const detail = errorBody ? `：${errorBody.slice(0, 300)}` : "";
    throw new ArkUpstreamError(
      `火山方舟请求失败（HTTP ${response.status}）${detail}`,
      response.status
    );
  }

  if (!response.body) {
    throw new ArkUpstreamError("火山方舟未返回可读流", 502);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) {
          continue;
        }

        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") {
          if (payload === "[DONE]") {
            return;
          }
          continue;
        }

        try {
          const parsed = JSON.parse(payload) as ArkChatCompletionChunk;
          const delta = extractDeltaText(parsed);
          if (delta) {
            yield delta;
          }
        } catch {
          // 单条脏数据不应中断整次流式生成，跳过无法解析的 SSE 行。
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
