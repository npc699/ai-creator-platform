"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { FeedArticleCard } from "@/components/layout/feed-article-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { clearLocalDraft, getLocalDraft } from "@/lib/draft-idb";
import type { FeedArticleItem } from "@/lib/feed/types";

type DraftArticleListProps = {
  items: FeedArticleItem[];
  userId?: string;
};

type PendingDelete = {
  id: string;
  title: string;
};

/** 草稿箱列表：支持删除草稿并刷新页面。 */
export function DraftArticleList({ items, userId }: DraftArticleListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleteDialogError, setDeleteDialogError] = useState<string | null>(null);

  const closeDeleteDialog = useCallback(() => {
    if (deletingId) {
      return;
    }
    setPendingDelete(null);
    setDeleteDialogError(null);
  }, [deletingId]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete || deletingId) {
      return;
    }

    setDeleteDialogError(null);
    setDeletingId(pendingDelete.id);

    try {
      const response = await fetch(`/api/drafts/${pendingDelete.id}`, {
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

      if (userId) {
        const local = await getLocalDraft(userId);
        if (local?.draftId === pendingDelete.id) {
          await clearLocalDraft(userId);
        }
      }

      setPendingDelete(null);
      router.refresh();
    } catch {
      setDeleteDialogError("删除失败，请稍后重试");
    } finally {
      setDeletingId(null);
    }
  }, [deletingId, pendingDelete, router, userId]);

  return (
    <>
      <div className="space-y-4 p-4">
        {items.map(({ id, title, ...item }) => (
          <FeedArticleCard
            key={id}
            {...item}
            isDeleting={deletingId === id}
            onDelete={() => {
              setDeleteDialogError(null);
              setPendingDelete({ id, title });
            }}
            showMetrics={false}
            title={title}
          />
        ))}
      </div>

      {pendingDelete ? (
        <ConfirmDialog
          confirmLabel="确定"
          confirmingLabel="删除中…"
          description={`删除后将无法恢复，草稿「${pendingDelete.title || "无标题草稿"}」将被永久删除。`}
          errorMessage={deleteDialogError}
          isConfirming={deletingId === pendingDelete.id}
          onCancel={closeDeleteDialog}
          onConfirm={() => void confirmDelete()}
          title="确定删除该草稿吗？"
        />
      ) : null}
    </>
  );
}
