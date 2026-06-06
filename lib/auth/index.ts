// 认证模块服务端入口：Auth.js、会话、Schema 与 identifier。
// 客户端请改用 @/lib/auth/client，避免误导入 server-only 代码。
import "server-only";

export { auth, handlers, signIn, signOut } from "./config";
export { getCurrentUser } from "./session";
export { findActiveUserById, type ActiveSessionUser } from "./session-user";
export {
  authEmailSchema,
  authPhoneSchema,
  credentialsSchema,
  registerSchema,
} from "./schemas";
export {
  parseAuthIdentifier,
  findUserByIdentifier,
  type AuthIdentifier,
} from "./identifier";
export {
  isValidAuthEmail,
  isValidAuthPhone,
  normalizePhone,
} from "./validators";
