"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  appendEditorReturnPath,
  getCurrentReturnPath,
} from "@/lib/editor/editor-navigation";
import { btnSoft } from "@/lib/utils/brand";

type FeedEmptyStateProps = {
  message: string;
  actionLabel: string;
  actionHref: string;
};

function FeedEmptyStateInner({
  message,
  actionLabel,
  actionHref,
}: FeedEmptyStateProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnPath = getCurrentReturnPath(pathname, searchParams.toString());
  const href = appendEditorReturnPath(actionHref, returnPath);

  return (
    <div className="px-6 py-16 text-center">
      <p className="text-sm text-zinc-600">{message}</p>
      <Link
        className={`mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-medium ${btnSoft}`}
        href={href}
      >
        {actionLabel}
      </Link>
    </div>
  );
}

export function FeedEmptyState(props: FeedEmptyStateProps) {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-16 text-center">
          <p className="text-sm text-zinc-600">{props.message}</p>
          <Link
            className={`mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-medium ${btnSoft}`}
            href={props.actionHref}
          >
            {props.actionLabel}
          </Link>
        </div>
      }
    >
      <FeedEmptyStateInner {...props} />
    </Suspense>
  );
}
