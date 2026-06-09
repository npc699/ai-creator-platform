// 认证模块客户端入口：仅 re-export 无 Node/Prisma 依赖的安全工具。
// 新增客户端可用导出时须确认不会把 server-only 代码打进浏览器 bundle。
export { getSafeCallbackPath, resolveSafeCallbackUrl } from "./safe-callback-url";
