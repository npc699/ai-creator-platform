// Zod 请求契约：API route 入参校验与 infer 类型。
// 无 server-only；客户端可 `import type` 复用 Input 类型。
export {
  postPublishSchema,
  postUpdateSchema,
  postStatusPatchSchema,
  type PostPublishInput,
  type PostUpdateInput,
  type PostStatusPatchInput,
} from "./post";

export {
  DRAFT_DEFAULT_TITLE,
  draftCreateSchema,
  draftUpdateSchema,
  type DraftCreateInput,
  type DraftUpdateInput,
} from "./draft";

export {
  promptCategorySchema,
  promptCreateSchema,
  promptUpdateSchema,
  type PromptCreateInput,
  type PromptUpdateInput,
} from "./prompt";

export {
  ASSET_SOURCES,
  assetSourceSchema,
  assetRegisterSchema,
  assetRenameSchema,
  type AssetRegisterInput,
  type AssetRenameInput,
} from "./asset";

export {
  userProfileUpdateSchema,
  type UserProfileUpdateInput,
} from "./user-profile";

export { coverUrlSchema } from "./cover-url";

export {
  remoteImagePersistSchema,
  type RemoteImagePersistInput,
} from "./remote-image";
