import "server-only";

export const DEFAULT_ARK_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";

/** 本服务侧配置缺失（如未设 ARK_API_KEY），与上游连通性无关；路由层映射为 503。 */
export class ArkConfigError extends Error {
  readonly code = "ARK_CONFIG_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ArkConfigError";
  }
}

/** 火山方舟请求失败或响应不合预期；携带上游 HTTP 状态，供路由层区分 502/透传 5xx。 */
export class ArkUpstreamError extends Error {
  readonly code = "ARK_UPSTREAM_ERROR";
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ArkUpstreamError";
    this.status = status;
  }
}

/** 文本与生图共用的 API Key 与 Base URL。 */
export function getArkBaseConfig() {
  const apiKey = process.env.ARK_API_KEY?.trim();
  const baseUrl = (
    process.env.ARK_BASE_URL?.trim() || DEFAULT_ARK_BASE_URL
  ).replace(/\/$/, "");

  if (!apiKey) {
    throw new ArkConfigError("未配置 ARK_API_KEY，无法调用火山方舟");
  }

  return { apiKey, baseUrl };
}
