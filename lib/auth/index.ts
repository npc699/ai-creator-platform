export { auth, handlers, signIn, signOut } from "./config";
export { getCurrentUser } from "./session";
export {
  authEmailSchema,
  authPhoneSchema,
  credentialsSchema,
  registerSchema,
} from "./schemas";
export { parseAuthIdentifier, findUserByIdentifier } from "./identifier";
// 客户端请使用 @/lib/auth/safe-callback-url 或 @/lib/auth/client，勿从本文件导入纯工具函数。
