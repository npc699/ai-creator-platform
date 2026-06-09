"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DialogShellProps = {
  title: string;
  titleId: string;
  description?: ReactNode;
  errorMessage?: string | null;
  /** 是否允许点击遮罩关闭 */
  closeOnOverlayClick?: boolean;
  isBusy?: boolean;
  overlayClassName?: string;
  onOverlayClose: () => void;
  children: ReactNode;
};

/** 通用弹窗壳：遮罩 + 居中卡片 + 标题/描述/错误区 + 自定义 footer。 */
export function DialogShell({
  title,
  titleId,
  description,
  errorMessage,
  closeOnOverlayClick = true,
  isBusy = false,
  overlayClassName,
  onOverlayClose,
  children,
}: DialogShellProps) {
  const dismissOnOverlay = closeOnOverlayClick && !isBusy;

  return (
    <div
      className={cn(
        "fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4",
        overlayClassName
      )}
      onClick={dismissOnOverlay ? onOverlayClose : undefined}
      role="presentation"
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 className="text-base font-semibold text-zinc-900" id={titleId}>
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-zinc-600">{description}</p>
        ) : null}
        {errorMessage ? (
          <p
            aria-live="polite"
            className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
