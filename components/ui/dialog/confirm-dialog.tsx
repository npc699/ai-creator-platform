"use client";

import { DialogShell } from "./dialog-shell";
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

/** 通用确认弹窗：底部取消 + 确定。 */
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
  return (
    <DialogShell
      closeOnOverlayClick={closeOnOverlayClick}
      description={description}
      errorMessage={errorMessage}
      isBusy={isConfirming}
      overlayClassName={overlayClassName}
      onOverlayClose={onCancel}
      title={title}
      titleId="confirm-dialog-title"
    >
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
    </DialogShell>
  );
}
