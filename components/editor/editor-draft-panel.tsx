"use client";

import { FileEdit, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EditorDraftSwitchDialog } from "@/components/editor/editor-draft-switch-dialog";
import { useEditorContext } from "@/components/editor/editor-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { clearLocalDraft, clearNewDraftLocal, getLocalDraft } from "@/lib/draft-idb";
import { getDraftStorageKey } from "@/lib/draft-sync";
import {
  buildEditorHref,
  EDITOR_FROM_PARAM,
} from "@/lib/editor/editor-navigation";
import { buildPostExcerpt } from "@/lib/posts/excerpt";
import { btnEditorHeaderGhost, btnEditorHeaderGhostDanger } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type DraftListItem = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

type EditorDraftPanelProps = {
  onClose: () => void;
};

function formatDraftTime(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 编辑器内草稿箱侧栏：切换草稿 / 新建，带脏状态确认。 */
export function EditorDraftPanel({ onClose }: EditorDraftPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    draftId,
    isDirty,
    saveDraft,
    saveStatus,
    userId,
  } = useEditorContext();

  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteDraft, setPendingDeleteDraft] = useState<DraftListItem | null>(
    null
  );
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [isSwitchSaving, setIsSwitchSaving] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  const urlDraftId = searchParams.get("draftId");
  const editorReturnFrom = searchParams.get(EDITOR_FROM_PARAM);
  const isNewDraftSession = !urlDraftId;
  const isSaving = saveStatus === "saving" || isSwitchSaving;

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/drafts", {
          signal: controller.signal,
          credentials: "same-origin",
        });

        if (!response.ok) {
          setLoadError("加载草稿列表失败");
          return;
        }

        const data = (await response.json()) as { drafts: DraftListItem[] };
        setDrafts(data.drafts ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setLoadError("加载草稿列表失败");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  const getCurrentLocation = useCallback(() => {
    const activeId = urlDraftId ?? draftId;
    if (activeId) {
      return buildEditorHref({ draftId: activeId, from: editorReturnFrom });
    }
    return buildEditorHref({ from: editorReturnFrom });
  }, [draftId, editorReturnFrom, urlDraftId]);

  const buildDraftEditorHref = useCallback(
    (targetDraftId: string) =>
      buildEditorHref({ draftId: targetDraftId, from: editorReturnFrom }),
    [editorReturnFrom]
  );

  const buildNewDraftEditorHref = useCallback(
    () => buildEditorHref({ from: editorReturnFrom }),
    [editorReturnFrom]
  );

  const navigateTo = useCallback(
    (targetHref: string) => {
      if (targetHref === getCurrentLocation()) {
        onClose();
        return;
      }

      if (isDirty()) {
        setSwitchError(null);
        setPendingHref(targetHref);
        return;
      }

      router.push(targetHref);
      onClose();
    },
    [getCurrentLocation, isDirty, onClose, router]
  );

  const handleSaveAndSwitch = useCallback(async () => {
    if (!pendingHref) {
      return;
    }

    setIsSwitchSaving(true);
    setSwitchError(null);
    try {
      const result = await saveDraft();
      if (!result.ok) {
        const message =
          result.reason === "empty"
            ? "正文为空，无法保存。请先输入正文，或选择「不保存并切换」。"
            : result.message;
        setSwitchError(message);
        return;
      }

      router.push(pendingHref);
      setPendingHref(null);
      onClose();
    } finally {
      setIsSwitchSaving(false);
    }
  }, [onClose, pendingHref, router, saveDraft]);

  const handleCancelSwitch = useCallback(() => {
    setSwitchError(null);
    setPendingHref(null);
  }, []);

  const handleDiscardAndSwitch = useCallback(() => {
    if (!pendingHref) {
      return;
    }

    router.push(pendingHref);
    setPendingHref(null);
    onClose();
  }, [onClose, pendingHref, router]);

  const closeDeleteDialog = useCallback(() => {
    if (deletingId) {
      return;
    }
    setPendingDeleteDraft(null);
    setDeleteError(null);
  }, [deletingId]);

  const handleDeleteDraft = useCallback(async () => {
    if (!pendingDeleteDraft || deletingId) {
      return;
    }

    const draft = pendingDeleteDraft;
    setDeleteError(null);
    setDeletingId(draft.id);

    try {
      const response = await fetch(`/api/drafts/${draft.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setDeleteError(payload?.error ?? "删除失败，请稍后重试");
        return;
      }

      setDrafts((previous) => previous.filter((item) => item.id !== draft.id));

      const storageKey = getDraftStorageKey(userId, draft.id);
      const local = await getLocalDraft(storageKey);
      if (local?.draftId === draft.id) {
        await clearLocalDraft(storageKey);
      }

      setPendingDeleteDraft(null);

      const isActive = draftId === draft.id || urlDraftId === draft.id;
      if (isActive) {
        router.push(buildNewDraftEditorHref());
        onClose();
      }
    } catch {
      setDeleteError("删除失败，请稍后重试");
    } finally {
      setDeletingId(null);
    }
  }, [
    buildNewDraftEditorHref,
    deletingId,
    draftId,
    onClose,
    pendingDeleteDraft,
    router,
    urlDraftId,
    userId,
  ]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/30"
        onClick={onClose}
        role="presentation"
      />
      <aside
        aria-label="草稿箱"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-200/80 bg-white shadow-xl"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/80 px-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
            <FileEdit className="h-4 w-4" />
            草稿箱
          </div>
          <button
            aria-label="关闭草稿箱"
            className={btnEditorHeaderGhost}
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="shrink-0 border-b border-zinc-200/80 p-3">
          <button
            className={cn(
              btnEditorHeaderGhost,
              "w-full justify-center",
              isNewDraftSession && !draftId && "bg-zinc-100 text-zinc-950!"
            )}
            onClick={() => navigateTo(buildNewDraftEditorHref())}
            type="button"
          >
            <Plus className="h-4 w-4" />
            新建草稿
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <p className="px-2 py-4 text-center text-sm text-zinc-500">
              加载中…
            </p>
          ) : loadError ? (
            <p className="px-2 py-4 text-center text-sm text-red-600">
              {loadError}
            </p>
          ) : drafts.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-zinc-500">
              还没有草稿
            </p>
          ) : (
            <ul className="space-y-1">
              {drafts.map((draft) => {
                const isActive = draftId === draft.id || urlDraftId === draft.id;
                const isDeleting = deletingId === draft.id;

                return (
                  <li
                    className={cn(
                      "flex items-stretch gap-1 rounded-xl",
                      isActive &&
                        "bg-brand-surface ring-1 ring-inset ring-brand-border"
                    )}
                    key={draft.id}
                  >
                    <button
                      className={cn(
                        "min-w-0 flex-1 rounded-xl px-3 py-3 text-left transition-colors",
                        !isActive && "hover:bg-zinc-50"
                      )}
                      onClick={() =>
                        navigateTo(buildDraftEditorHref(draft.id))
                      }
                      type="button"
                    >
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {draft.title || "无标题草稿"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                        {buildPostExcerpt(draft.content)}
                      </p>
                      <p className="mt-1.5 text-xs text-zinc-400">
                        {formatDraftTime(draft.updatedAt)}
                      </p>
                    </button>
                    <button
                      aria-busy={isDeleting}
                      aria-label={
                        isDeleting
                          ? "删除中"
                          : `删除草稿：${draft.title || "无标题草稿"}`
                      }
                      className={cn(
                        btnEditorHeaderGhostDanger,
                        "my-2 mr-2 h-9 w-9 shrink-0 self-center justify-center px-0"
                      )}
                      disabled={isDeleting}
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDeleteDraft(draft);
                      }}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-zinc-200/80 p-3">
          <Link
            className={cn(btnEditorHeaderGhost, "w-full justify-center")}
            href="/drafts"
            onClick={onClose}
          >
            查看全部草稿
          </Link>
        </div>
      </aside>

      {pendingHref ? (
        <EditorDraftSwitchDialog
          errorMessage={switchError}
          isSaving={isSaving}
          onCancel={handleCancelSwitch}
          onDiscard={handleDiscardAndSwitch}
          onSaveAndSwitch={() => void handleSaveAndSwitch()}
        />
      ) : null}

      {pendingDeleteDraft ? (
        <ConfirmDialog
          closeOnOverlayClick={false}
          confirmLabel="确定"
          confirmingLabel="删除中…"
          description={`删除后将无法恢复，草稿「${pendingDeleteDraft.title || "无标题草稿"}」将被永久删除。`}
          errorMessage={deleteError}
          isConfirming={deletingId === pendingDeleteDraft.id}
          onCancel={closeDeleteDialog}
          onConfirm={() => void handleDeleteDraft()}
          title="确定删除该草稿吗？"
        />
      ) : null}
    </>
  );
}
