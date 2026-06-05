"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PromptCard } from "@/components/prompts";
import { PromptFiltersHeader } from "@/components/prompts";
import { PromptFormDialog } from "@/components/prompts";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteEditorPrompt } from "@/lib/editor/prompts-api";
import {
  getPromptEmptyMessage,
  sortPrompts,
  type PromptCategory,
  type PromptScope,
  type PromptSort,
} from "@/lib/feed/panel-params";
import type { SerializedPrompt } from "@/lib/prompts/serialize";
import { cn } from "@/lib/utils";

type PromptsPageContentProps = {
  initialPrompts: SerializedPrompt[];
  scope: PromptScope;
  category: PromptCategory;
  sort: PromptSort;
};

type PendingDelete = {
  id: string;
  title: string;
};

/** 提示词广场主体：筛选顶栏 + 卡片网格 + 增删改对话框。 */
export function PromptsPageContent({
  initialPrompts,
  scope,
  category,
  sort,
}: PromptsPageContentProps) {
  const listKey = `${scope}:${category}:${sort}`;
  const [prompts, setPrompts] = useState(initialPrompts);
  const [prevInitialPrompts, setPrevInitialPrompts] = useState(initialPrompts);
  const [prevListKey, setPrevListKey] = useState(listKey);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SerializedPrompt | null>(
    null
  );
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [copyNoticeTone, setCopyNoticeTone] = useState<"success" | "error">(
    "success"
  );
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 筛选或服务端列表变化时重置本地列表，避免在 effect 里同步 state。
  if (listKey !== prevListKey || initialPrompts !== prevInitialPrompts) {
    setPrevListKey(listKey);
    setPrevInitialPrompts(initialPrompts);
    setPrompts(initialPrompts);
  }

  useEffect(() => {
    if (!copyNotice) {
      return;
    }

    const timer = window.setTimeout(() => setCopyNotice(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copyNotice]);

  const visiblePrompts = useMemo(
    () => sortPrompts(prompts, sort),
    [prompts, sort]
  );

  const emptyMessage = getPromptEmptyMessage(scope, category);

  const handleCreateClick = useCallback(() => {
    setEditingPrompt(null);
    setDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((prompt: SerializedPrompt) => {
    if (prompt.isOfficial) {
      return;
    }
    setEditingPrompt(prompt);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setEditingPrompt(null);
  }, []);

  const handleSaved = useCallback(
    (prompt: SerializedPrompt) => {
      if (scope === "mine" && !prompt.isOfficial) {
        setPrompts((current) => [
          prompt,
          ...current.filter((item) => item.id !== prompt.id),
        ]);
      }
      handleDialogClose();
    },
    [handleDialogClose, scope]
  );

  const handleFavoriteToggle = useCallback(
    (prompt: SerializedPrompt) => {
      if (scope === "favorite" && !prompt.isFavorite) {
        setPrompts((current) =>
          current.filter((item) => item.id !== prompt.id)
        );
        return;
      }

      setPrompts((current) =>
        current.map((item) =>
          item.id === prompt.id
            ? { ...item, isFavorite: prompt.isFavorite }
            : item
        )
      );
    },
    [scope]
  );

  const handleDeleteRequest = useCallback((prompt: SerializedPrompt) => {
    setDeleteError(null);
    setPendingDelete({ id: prompt.id, title: prompt.title });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    if (isDeleting) {
      return;
    }
    setPendingDelete(null);
    setDeleteError(null);
  }, [isDeleting]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete || isDeleting) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteEditorPrompt(pendingDelete.id);
      setPrompts((current) =>
        current.filter((item) => item.id !== pendingDelete.id)
      );
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "删除失败");
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, pendingDelete]);

  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopyNoticeTone("success");
      setCopyNotice("已复制到剪贴板");
    } catch {
      setCopyNoticeTone("error");
      setCopyNotice("复制失败，请手动复制");
    }
  }, []);

  return (
    <>
      <PromptFiltersHeader
        activeCategory={category}
        activeScope={scope}
        onCreateClick={handleCreateClick}
      />

      {copyNotice ? (
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-4 z-80 flex justify-center px-4"
          role="status"
        >
          <p
            className={cn(
              "rounded-xl border px-4 py-2 text-sm shadow-lg",
              copyNoticeTone === "success"
                ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                : "border-red-100 bg-red-50 text-red-700"
            )}
          >
            {copyNotice}
          </p>
        </div>
      ) : null}

      {visiblePrompts.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm text-zinc-600">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid auto-rows-fr items-stretch gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {visiblePrompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              onCopy={() => void handleCopy(prompt.content)}
              onDeleteRequest={
                prompt.isOfficial
                  ? undefined
                  : () => handleDeleteRequest(prompt)
              }
              onEdit={() => handleEditClick(prompt)}
              onFavoriteChange={handleFavoriteToggle}
              prompt={prompt}
            />
          ))}
        </div>
      )}

      {dialogOpen ? (
        <PromptFormDialog
          onClose={handleDialogClose}
          onSaved={handleSaved}
          prompt={editingPrompt}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          closeOnOverlayClick={false}
          confirmLabel="确定"
          confirmingLabel="删除中…"
          description={`删除后将无法恢复，Prompt「${pendingDelete.title}」将被永久删除。`}
          errorMessage={deleteError}
          isConfirming={isDeleting}
          overlayClassName="z-80"
          onCancel={closeDeleteDialog}
          onConfirm={() => void confirmDelete()}
          title="确定删除该 Prompt 吗？"
        />
      ) : null}
    </>
  );
}
