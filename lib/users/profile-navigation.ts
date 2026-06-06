import {
  EDITOR_FROM_PARAM,
  sanitizeReturnPath,
  type EditorBackTarget,
} from "@/lib/editor/navigation";

/** 发布者主页链接，携带来源路径供顶栏「返回」使用。 */
export function buildAuthorProfileHref(
  userId: string,
  returnPath?: string | null
) {
  const base = `/users/${userId}`;
  const safeFrom = sanitizeReturnPath(returnPath);

  if (!safeFrom) {
    return base;
  }

  const params = new URLSearchParams();
  params.set(EDITOR_FROM_PARAM, safeFrom);
  return `${base}?${params.toString()}`;
}

/** 发布者主页顶栏返回目标：优先回到 from 所指页面。 */
export function getAuthorProfileBackTarget(
  from: string | null | undefined
): EditorBackTarget {
  const safeFrom = sanitizeReturnPath(from ?? null);

  if (safeFrom) {
    return {
      href: safeFrom,
      label: "返回",
    };
  }

  return {
    href: "/",
    label: "返回",
  };
}

/** 发布者主页路径，供文章列表 from 参数使用。 */
export function buildAuthorProfilePath(userId: string) {
  return `/users/${userId}`;
}
