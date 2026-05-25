"use client";

import { Pencil, Power, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { PostStatus } from "@/lib/generated/prisma/client";
import {
  btnEditorHeaderGhost,
  btnEditorHeaderGhostDanger,
  btnEditorHeaderGhostDangerDisabled,
  btnEditorHeaderGhostDisabled,
} from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type PostReaderActionsProps = {
  postId: string;
  status: PostStatus;
};

export function PostReaderActions({ postId, status }: PostReaderActionsProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDialogError, setDeleteDialogError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  const isPublished = localStatus === "PUBLISHED";
  const isToggleBusy = isSubmitting || isRefreshing;

  async function handleToggleStatus() {
    if (isToggleBusy || isDeleting) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const nextStatus: PostStatus = isPublished ? "ARCHIVED" : "PUBLISHED";

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setErrorMessage(payload?.error ?? "状态更新失败，请稍后重试");
        return;
      }

      setLocalStatus(nextStatus);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setErrorMessage("状态更新失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  }

  const closeDeleteDialog = useCallback(() => {
    if (isDeleting) {
      return;
    }
    setShowDeleteConfirm(false);
    setDeleteDialogError(null);
  }, [isDeleting]);

  const confirmDelete = useCallback(async () => {
    if (isDeleting || isToggleBusy) {
      return;
    }

    setDeleteDialogError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setDeleteDialogError(payload?.error ?? "删除失败，请稍后重试");
        return;
      }

      setShowDeleteConfirm(false);
      router.push("/published");
      router.refresh();
    } catch {
      setDeleteDialogError("删除失败，请稍后重试");
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, isToggleBusy, postId, router]);

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Link className={btnEditorHeaderGhost} href={`/editor/${postId}`}>
            <Pencil className="h-4 w-4" />
            编辑
          </Link>
          <button
            aria-busy={isToggleBusy}
            className={cn(btnEditorHeaderGhost, btnEditorHeaderGhostDisabled)}
            disabled={isToggleBusy || isDeleting}
            onClick={() => void handleToggleStatus()}
            type="button"
          >
            <Power className="h-4 w-4" />
            {isPublished ? "下线" : "上线"}
          </button>
          <button
            className={cn(
              btnEditorHeaderGhostDanger,
              btnEditorHeaderGhostDangerDisabled
            )}
            disabled={isDeleting}
            onClick={() => {
              setDeleteDialogError(null);
              setShowDeleteConfirm(true);
            }}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "删除中…" : "删除"}
          </button>
        </div>
        {errorMessage ? (
          <p className="text-xs text-red-500">{errorMessage}</p>
        ) : null}
      </div>

      {showDeleteConfirm ? (
        <ConfirmDialog
          closeOnOverlayClick={false}
          confirmLabel="确定"
          confirmingLabel="删除中…"
          description="删除后将无法恢复，文章将被永久删除。"
          errorMessage={deleteDialogError}
          isConfirming={isDeleting}
          onCancel={closeDeleteDialog}
          onConfirm={() => void confirmDelete()}
          title="确定删除这篇文章吗？"
        />
      ) : null}
    </>
  );
}
