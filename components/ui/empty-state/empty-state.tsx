import Link from "next/link";
import type { ReactNode } from "react";

import { btnSoft } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  message: string;
  actionHref?: string;
  actionLabel?: string;
  action?: ReactNode;
  className?: string;
};

/** 通用空状态：居中文案 + 可选 CTA 链接或自定义 action。 */
export function EmptyState({
  message,
  actionHref,
  actionLabel,
  action,
  className,
}: EmptyStateProps) {
  const actionNode =
    action ??
    (actionHref && actionLabel ? (
      <Link
        className={cn(
          "mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-medium",
          btnSoft
        )}
        href={actionHref}
      >
        {actionLabel}
      </Link>
    ) : null);

  return (
    <div className={cn("px-6 py-16 text-center", className)}>
      <p className="text-sm text-zinc-600">{message}</p>
      {actionNode}
    </div>
  );
}
