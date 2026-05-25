import "server-only";

import {
  ArkConfigError,
  ArkUpstreamError,
  getArkBaseConfig,
} from "@/lib/ai/ark-config";
import type { AiImageSize } from "@/lib/ai/image-schema";

const IMAGE_GENERATION_TIMEOUT_MS = 120_000;

export type ArkImageOptions = {
  prompt: string;
  size?: AiImageSize;
  signal?: AbortSignal;
};

export type ArkImageResult = {
  url: string;
  revisedPrompt?: string;
};

type ArkImagesResponse = {
  data?: Array<{
    url?: string;
    revised_prompt?: string;
  }>;
  error?: {
    message?: string;
  };
};

function getArkImageConfig() {
  const base = getArkBaseConfig();
  const model = process.env.ARK_IMAGE_MODEL?.trim();

  if (!model) {
    throw new ArkConfigError(
      "未配置 ARK_IMAGE_MODEL（文生图模型或推理接入点 ID），无法调用火山方舟生图"
    );
  }

  return { ...base, model };
}

function mergeAbortSignals(signals: AbortSignal[]) {
  const active = signals.filter(Boolean);
  if (active.length === 0) {
    return undefined;
  }

  if (active.length === 1) {
    return active[0];
  }

  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any(active);
  }

  const controller = new AbortController();

  for (const signal of active) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }

    signal.addEventListener(
      "abort",
      () => {
        controller.abort(signal.reason);
      },
      { once: true }
    );
  }

  return controller.signal;
}

function createImageGenerationSignal(requestSignal?: AbortSignal) {
  const timeoutSignal =
    typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(IMAGE_GENERATION_TIMEOUT_MS)
      : undefined;

  return mergeAbortSignals(
    [requestSignal, timeoutSignal].filter(
      (signal): signal is AbortSignal => signal !== undefined
    )
  );
}

function extractImageResult(payload: ArkImagesResponse): ArkImageResult {
  const first = payload.data?.[0];
  const url = first?.url?.trim();

  if (!url || !first) {
    throw new ArkUpstreamError("火山方舟未返回图片 URL", 502);
  }

  const revisedPrompt = first.revised_prompt?.trim();

  return {
    url,
    ...(revisedPrompt ? { revisedPrompt } : {}),
  };
}

/**
 * 调用火山方舟 Images Generations 文生图接口（OpenAI 兼容）。
 * 模型由环境变量 ARK_IMAGE_MODEL 指定。
 */
export async function generateArkImage({
  prompt,
  size = "2K",
  signal,
}: ArkImageOptions): Promise<ArkImageResult> {
  const { apiKey, baseUrl, model } = getArkImageConfig();

  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      size,
      response_format: "url",
      watermark: true,
    }),
    signal: createImageGenerationSignal(signal),
  });

  const responseBody = await response.text().catch(() => "");

  if (!response.ok) {
    let detail = responseBody.slice(0, 300);

    try {
      const parsed = JSON.parse(responseBody) as ArkImagesResponse;
      detail = parsed.error?.message?.trim() || detail;
    } catch {
      // 非 JSON 错误体直接截断透传。
    }

    throw new ArkUpstreamError(
      detail
        ? `火山方舟生图失败（HTTP ${response.status}）：${detail}`
        : `火山方舟生图失败（HTTP ${response.status}）`,
      response.status
    );
  }

  let payload: ArkImagesResponse;

  try {
    payload = JSON.parse(responseBody) as ArkImagesResponse;
  } catch {
    throw new ArkUpstreamError("火山方舟生图响应格式无效", 502);
  }

  return extractImageResult(payload);
}
