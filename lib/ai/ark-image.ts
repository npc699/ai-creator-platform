import "server-only";

import {
  ArkConfigError,
  ArkUpstreamError,
  getArkBaseConfig,
} from "./ark-config";
import type { AiImageSize } from "./image-schema";

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

// 火山方舟图片生成模型配置
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

/**
 * 合并多个 AbortSignal，返回第一个触发 abort 的信号。
 * 如果所有信号都没有 abort，则返回 undefined。
 */
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

/**
 * 创建图片生成的 AbortSignal，包含请求信号和超时信号。
 * 超时时间由 IMAGE_GENERATION_TIMEOUT_MS 环境变量指定，默认 120s。
 */
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

/**
 * 从火山方舟图片生成响应中提取图片 URL 和可选的修订提示。
 * 如果响应格式无效或缺少必要字段，会抛出异常。
 */
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
