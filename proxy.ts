// 页面级路由守卫：在渲染前拦截未登录访问，并处理登录态与认证页互斥跳转。
// Next.js 16 根目录 proxy（Middleware 演进形态）；仅匹配页面，API 与静态资源不在此拦截。
// 与 (main)/layout.tsx 的 getCurrentUser() 形成双重校验，layout 侧为兜底而非重复业务逻辑。
import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

import { findActiveUserById } from "@/lib/auth";
import { getSafeCallbackPath } from "@/lib/auth/client";

// 访客可访问的页面白名单；其余路径默认需登录。
const authRoutes = new Set(["/login", "/register"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = authRoutes.has(pathname);

  // 只解码 JWT 取 userId，不引入 Auth.js 全栈；用户是否存在交给 session-user 轻量查库。
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  const userId = typeof token?.id === "string" ? token.id : undefined;
  const activeUser = await findActiveUserById(userId);
  const isAuthenticated = activeUser !== null;

  // 未登录访问受保护页 → 带安全 callbackUrl 跳转登录。
  if (!isAuthenticated && !isAuthRoute) {
    const loginUrl = new URL("/login", request.url);
    const safeCallbackPath = getSafeCallbackPath(pathname) ?? "/";
    loginUrl.searchParams.set("callbackUrl", safeCallbackPath);

    // Cookie 仍有效但用户已删：先 signOut 清 Cookie，避免带着无效 JWT 反复重定向。
    if (token) {
      const signOutUrl = new URL("/api/auth/signout", request.url);
      signOutUrl.searchParams.set("callbackUrl", loginUrl.toString());
      return NextResponse.redirect(signOutUrl);
    }

    return NextResponse.redirect(loginUrl);
  }

  // 已登录用户不应再看到登录/注册页，直接送回首页。
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // 排除 api、Next 内部静态资源、favicon 及带扩展名的静态文件。
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
