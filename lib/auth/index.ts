// 认证模块服务端入口：聚合 Auth.js、会话、Schema 与 identifier 工具。
// 客户端请改用 @/lib/auth/client 或 @/lib/auth/safe-callback-url，避免误导入 server-only 代码。
export { auth, handlers, signIn, signOut } from "./config";
export { getCurrentUser } from "./session";
export {
  authEmailSchema,
  authPhoneSchema,
  credentialsSchema,
  registerSchema,
} from "./schemas";
export { parseAuthIdentifier, findUserByIdentifier } from "./identifier";
