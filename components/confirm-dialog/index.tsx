"use client";

import {
  btnCreateAction,
  btnCreateActionDisabled,
  btnEditorHeaderGhost,
} from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmingLabel?: string;
  errorMessage?: string | null;
  isConfirming?: boolean;
  /** 是否允许点击遮罩关闭；删除确认应设为 false。 */
  closeOnOverlayClick?: boolean;
  overlayClassName?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/** 通用确认弹窗：与草稿切换弹窗一致的样式，底部取消 + 确定。 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "确定",
  cancelLabel = "取消",
  confirmingLabel = "处理中…",
  errorMessage,
  isConfirming = false,
  closeOnOverlayClick = true,
  overlayClassName,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dismissOnOverlay = closeOnOverlayClick && !isConfirming;

  return (
    <div
      className={cn(
        "fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4",
        overlayClassName
      )}
      onClick={dismissOnOverlay ? onCancel : undefined}
      role="presentation"
    >
      <div
        aria-labelledby="confirm-dialog-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2
          className="text-base font-semibold text-zinc-900"
          id="confirm-dialog-title"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-zinc-600">{description}</p>
        {errorMessage ? (
          <p
            aria-live="polite"
            className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            className={btnEditorHeaderGhost}
            disabled={isConfirming}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={cn(btnCreateAction, btnCreateActionDisabled, "px-4 py-2")}
            disabled={isConfirming}
            onClick={onConfirm}
            type="button"
          >
            {isConfirming ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
