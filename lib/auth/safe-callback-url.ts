// 登录后不允许回跳到认证页，避免登录成功后再次进入登录/注册流程。
const blockedCallbackPaths = new Set(["/login", "/register"]);

// 检查路径是否包含不安全模式（如协议相对、外链、反斜杠、双重斜杠开头等）
function hasUnsafePathPattern(path: string) {
  if (!path.startsWith("/")) {
    return true;
  }

  if (path.startsWith("//")) {
    return true;
  }

  if (path.includes("://") || path.includes("\\")) {
    return true;
  }

  try {
    const decoded = decodeURIComponent(path);

    if (
      decoded.startsWith("//") ||
      decoded.includes("://") ||
      decoded.includes("\\")
    ) {
      return true;
    }
  } catch {
    return true;
  }

  return false;
}

// 校验同站相对路径，拒绝协议相对路径、外链和编码绕过。
// 用于 proxy.ts 写入 callbackUrl 时校验
export function getSafeCallbackPath(pathname: string): string | null {
  if (hasUnsafePathPattern(pathname)) {
    return null;
  }

  // 禁止回跳到登录或注册页面（避免登录后又被重定向回登录页，形成循环）
  if (blockedCallbackPaths.has(pathname)) {
    return null;
  }

  return pathname;
}

// 解析 callbackUrl 查询参数：完整 URL 必须与 origin 同源，相对路径走白名单校验。
// 用于 登录页读取 callbackUrl 查询参数时校验
export function resolveSafeCallbackUrl(
  callbackUrl: string | null | undefined,
  origin: string | URL
): string {
  if (!callbackUrl) {
    return "/";
  }

  const base = typeof origin === "string" ? new URL(origin) : origin;

  try {
    if (/^https?:\/\//i.test(callbackUrl)) {
      const target = new URL(callbackUrl);

      if (target.origin !== base.origin) {
        return "/";
      }

      return getSafeCallbackPath(target.pathname) ?? "/";
    }

    return getSafeCallbackPath(callbackUrl) ?? "/";
  } catch {
    return "/";
  }
}
