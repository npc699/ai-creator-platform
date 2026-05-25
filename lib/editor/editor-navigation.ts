/** 编辑器入口携带的返回路径 query 名。 */
export const EDITOR_FROM_PARAM = "from";

export type EditorBackTarget = {
  href: string;
  label: string;
};

const RETURN_PATH_PREFIXES = [
  "/",
  "/published",
  "/drafts",
  "/prompts",
  "/assets",
  "/posts",
] as const;

function isEditorPath(pathname: string) {
  return pathname === "/editor" || pathname.startsWith("/editor/");
}

function isAllowedReturnPath(pathname: string) {
  return RETURN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** 将外部页面路径编码为 query，供编辑器返回使用。 */
export function sanitizeReturnPath(from: string | null | undefined) {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return null;
  }

  const pathname = from.split("?")[0] ?? from;
  if (isEditorPath(pathname) || !isAllowedReturnPath(pathname)) {
    return null;
  }

  return from;
}

/** 当前非编辑器页面的完整路径（含 query），用作进入编辑器时的 from。 */
export function getCurrentReturnPath(pathname: string, search: string) {
  if (isEditorPath(pathname)) {
    return null;
  }

  const path = search ? `${pathname}?${search}` : pathname;
  return sanitizeReturnPath(path) ?? "/";
}

export function getReturnLabel(returnPath: string) {
  const pathname = returnPath.split("?")[0] ?? returnPath;

  switch (pathname) {
    case "/published":
      return "返回已发布";
    case "/drafts":
      return "返回草稿箱";
    case "/prompts":
      return "返回 Prompt 库";
    case "/assets":
      return "返回素材库";
    case "/":
      return "返回首页";
    default:
      if (pathname.startsWith("/posts/")) {
        return "返回文章";
      }
      return "返回";
  }
}

export function buildEditorHref(options: {
  postId?: string | null;
  draftId?: string | null;
  promptId?: string | null;
  from?: string | null;
}) {
  const { postId, draftId, promptId, from } = options;

  if (postId) {
    return `/editor/${postId}`;
  }

  const params = new URLSearchParams();
  if (draftId) {
    params.set("draftId", draftId);
  }
  if (promptId) {
    params.set("promptId", promptId);
  }

  const safeFrom = sanitizeReturnPath(from);
  if (safeFrom) {
    params.set(EDITOR_FROM_PARAM, safeFrom);
  }

  const query = params.toString();
  return query ? `/editor?${query}` : "/editor";
}

/** 为已有 /editor 链接追加 from（已有 draftId 或文章编辑路由时不处理）。 */
export function appendEditorReturnPath(href: string, returnPath: string | null) {
  if (!href.startsWith("/editor")) {
    return href;
  }

  const [path, query = ""] = href.split("?");
  if (path !== "/editor") {
    return href;
  }

  const params = new URLSearchParams(query);
  if (params.has("draftId")) {
    return href;
  }

  const safeFrom = sanitizeReturnPath(returnPath);
  if (!safeFrom || params.has(EDITOR_FROM_PARAM)) {
    return href;
  }

  params.set(EDITOR_FROM_PARAM, safeFrom);
  const nextQuery = params.toString();
  return nextQuery ? `/editor?${nextQuery}` : "/editor";
}

/** 编辑器顶栏「返回」：按路由模式决定目标与文案。 */
export function getEditorBackTarget(options: {
  postId: string | null;
  draftId: string | null;
  from: string | null;
}): EditorBackTarget {
  if (options.postId) {
    return {
      href: `/posts/${options.postId}`,
      label: "返回",
    };
  }

  if (options.draftId) {
    return {
      href: "/drafts",
      label: "返回",
    };
  }

  const safeFrom = sanitizeReturnPath(options.from);
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
