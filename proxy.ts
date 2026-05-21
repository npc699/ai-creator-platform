import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

import { getSafeCallbackPath } from "@/lib/auth/safe-callback-url";
import { findActiveUserById } from "@/lib/auth/session-user";

// 登录和注册页是访客唯一可访问的非 API 页面。
const authRoutes = new Set(["/login", "/register"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthRoute = authRoutes.has(pathname);
  // 在路由边界解码 Auth.js JWT，避免把 Prisma 引入 proxy 运行时。
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: request.nextUrl.protocol === "https:",
  });

  const userId = typeof token?.id === "string" ? token.id : undefined;
  const activeUser = await findActiveUserById(userId);
  const isAuthenticated = activeUser !== null;

  if (!isAuthenticated && !isAuthRoute) {
    const loginUrl = new URL("/login", request.url);
    // 仅写入通过白名单的同站路径，避免开放重定向到外部钓鱼站点。
    const safeCallbackPath = getSafeCallbackPath(pathname) ?? "/";
    loginUrl.searchParams.set("callbackUrl", safeCallbackPath);

    // JWT 仍有效但用户已删除时，先走 signOut 清理 Cookie，再进入登录页。
    if (token) {
      const signOutUrl = new URL("/api/auth/signout", request.url);
      signOutUrl.searchParams.set("callbackUrl", loginUrl.toString());
      return NextResponse.redirect(signOutUrl);
    }

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // 只拦截页面请求；API、Next 静态资源和普通静态文件保持不受影响。
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
