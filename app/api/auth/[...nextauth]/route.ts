import { handlers } from "@/lib/auth";

// 凭据登录依赖 bcrypt 和 Prisma，必须在 Node.js 运行时执行。
export const runtime = "nodejs";

// Auth.js 在这个 catch-all 路由下处理登录、登出、回调和 CSRF 请求。
export const { GET, POST } = handlers;
