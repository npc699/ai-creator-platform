import {
  EDITOR_FROM_PARAM,
  sanitizeReturnPath,
  type EditorBackTarget,
} from "@/lib/editor/navigation";

export { EDITOR_FROM_PARAM as READER_FROM_PARAM };

/** 文章详情链接，携带来源路径供顶栏「返回」使用。 */
export function buildPostHref(postId: string, returnPath?: string | null) {
  const base = `/posts/${postId}`;
  const safeFrom = sanitizeReturnPath(returnPath);

  if (!safeFrom) {
    return base;
  }

  const params = new URLSearchParams();
  params.set(EDITOR_FROM_PARAM, safeFrom);
  return `${base}?${params.toString()}`;
}

/** 文章详情顶栏返回目标：优先回到 from 所指列表页。 */
export function getPostReaderBackTarget(options: {
  from: string | null | undefined;
  isAuthor: boolean;
}): EditorBackTarget {
  const safeFrom = sanitizeReturnPath(options.from ?? null);

  if (safeFrom) {
    return {
      href: safeFrom,
      label: "返回",
    };
  }

  if (options.isAuthor) {
    return {
      href: "/published",
      label: "返回已发布",
    };
  }

  return {
    href: "/",
    label: "返回",
  };
}

/** 根据 from 生成 sessionStorage 滚动恢复键。 */
export function getFeedScrollStorageKey(returnPath: string) {
  return `feed-scroll:${returnPath}`;
}
