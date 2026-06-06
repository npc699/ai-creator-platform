"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/ui";
import {
  appendEditorReturnPath,
  getCurrentReturnPath,
} from "@/lib/editor/navigation";

type EditorLinkEmptyStateProps = {
  message: string;
  actionLabel: string;
  actionHref: string;
};

function EditorLinkEmptyStateInner({
  message,
  actionLabel,
  actionHref,
}: EditorLinkEmptyStateProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnPath = getCurrentReturnPath(pathname, searchParams.toString());
  const href = appendEditorReturnPath(actionHref, returnPath);

  return (
    <EmptyState actionHref={href} actionLabel={actionLabel} message={message} />
  );
}

/** 空列表 + 进入编辑器时保留当前页为返回目标。 */
export function EditorLinkEmptyState(props: EditorLinkEmptyStateProps) {
  return (
    <Suspense
      fallback={
        <EmptyState
          actionHref={props.actionHref}
          actionLabel={props.actionLabel}
          message={props.message}
        />
      }
    >
      <EditorLinkEmptyStateInner {...props} />
    </Suspense>
  );
}

/** @deprecated 使用 EditorLinkEmptyState */
export const FeedEmptyState = EditorLinkEmptyState;
