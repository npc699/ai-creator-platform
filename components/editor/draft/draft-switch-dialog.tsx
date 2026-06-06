"use client";

import {
  btnCreateAction,
  btnCreateActionDisabled,
  btnEditorHeaderGhost,
} from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type EditorDraftSwitchDialogProps = {
  errorMessage?: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onDiscard: () => void;
  onSaveAndSwitch: () => void;
};

/** 切换草稿前确认：保存 / 放弃 / 取消。 */
export function EditorDraftSwitchDialog({
  errorMessage,
  isSaving,
  onCancel,
  onDiscard,
  onSaveAndSwitch,
}: EditorDraftSwitchDialogProps) {
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <div
        aria-labelledby="draft-switch-title"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2
          className="text-base font-semibold text-zinc-900"
          id="draft-switch-title"
        >
          当前草稿有未保存修改
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          切换后将离开当前内容，请选择如何处理修改。
        </p>
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
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            取消
          </button>
          <button
            className={btnEditorHeaderGhost}
            disabled={isSaving}
            onClick={onDiscard}
            type="button"
          >
            不保存并切换
          </button>
          <button
            className={cn(
              btnCreateAction,
              btnCreateActionDisabled,
              "px-4 py-2"
            )}
            disabled={isSaving}
            onClick={onSaveAndSwitch}
            type="button"
          >
            {isSaving ? "保存中…" : "保存并切换"}
          </button>
        </div>
      </div>
    </div>
  );
}
