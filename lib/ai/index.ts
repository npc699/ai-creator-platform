/** 火山方舟：文本生成、生图与请求 Schema。服务端 API 可 `@/lib/ai`；Client 仅 deep import schema。 */
export {
  ArkConfigError,
  ArkUpstreamError,
  DEFAULT_ARK_BASE_URL,
  getArkBaseConfig,
} from "./ark-config";
export {
  chatArk,
  streamArkChat,
  type ArkChatMessage,
  type ArkChatOptions,
  type ArkStreamOptions,
} from "./ark";
export { generateArkImage, type ArkImageOptions, type ArkImageResult } from "./ark-image";
export { buildAiMessages } from "./prompts";
export {
  AI_GENERATE_MODES,
  aiGenerateModeSchema,
  aiGenerateRequestSchema,
  type AiGenerateMode,
  type AiGenerateRequest,
} from "./schema";
export {
  AI_IMAGE_SIZES,
  aiImageRequestSchema,
  aiImageResponseSchema,
  aiImageSizeSchema,
  type AiImageRequest,
  type AiImageResponse,
  type AiImageSize,
} from "./image-schema";
