"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";

import {
  appendEditorReturnPath,
  buildEditorHref,
  getCurrentReturnPath,
} from "@/lib/editor/editor-navigation";

type EditorEntryLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  draftId?: string | null;
  href?: string;
  postId?: string | null;
  promptId?: string | null;
};

/** 从非编辑器页面进入编辑器时，自动附带 from 返回路径。 */
export function EditorEntryLink({
  draftId,
  postId,
  promptId,
  href,
  ...props
}: EditorEntryLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnPath = getCurrentReturnPath(pathname, searchParams.toString());

  const resolvedHref = (() => {
    if (href) {
      return appendEditorReturnPath(href, returnPath);
    }

    return buildEditorHref({
      postId,
      draftId,
      promptId,
      from: returnPath,
    });
  })();

  return <Link href={resolvedHref} {...props} />;
}
