"use client";

import { Pencil, Trash2, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState, type KeyboardEvent } from "react";

import { assetLibraryCopy } from "@/components/media";
import { ConfirmDialog } from "@/components/ui";
import { isImageAsset } from "@/lib/assets/mime";
import { deleteEditorAsset, renameEditorAsset } from "@/lib/client/assets/api";
import { cn } from "@/lib/utils";

export type AssetListItem = {
  id: string;
  name: string;
  url: string;
  mimeType: string | null;
  source: "UPLOAD" | "AI";
  createdAt: string;
};

type AssetGridProps = {
  items: AssetListItem[];
  onItemsChange: (items: AssetListItem[]) => void;
};

type PendingDelete = {
  id: string;
  name: string;
};

export function AssetGrid({ items, onItemsChange }: AssetGridProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renamingAssetId, setRenamingAssetId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null
  );
  const [deleteDialogError, setDeleteDialogError] = useState<string | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<AssetListItem | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<Set<string>>(
    () => new Set()
  );

  const handleStartRename = useCallback((item: AssetListItem) => {
    setErrorMessage(null);
    setRenamingAssetId(item.id);
    setRenamingValue(item.name);
  }, []);

  const handleCancelRename = useCallback(() => {
    setRenamingAssetId(null);
    setRenamingValue("");
  }, []);

  const handleCommitRename = useCallback(
    async (id: string) => {
      const trimmed = renamingValue.trim();

      if (!trimmed) {
        handleCancelRename();
        return;
      }

      setErrorMessage(null);

      try {
        const updated = await renameEditorAsset(id, trimmed);
        onItemsChange(
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  name: updated.name,
                }
              : item
          )
        );
        handleCancelRename();
      } catch (renameError) {
        setErrorMessage(
          renameError instanceof Error ? renameError.message : "重命名失败"
        );
      }
    },
    [handleCancelRename, items, onItemsChange, renamingValue]
  );

  const handleRenameKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>, id: string) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void handleCommitRename(id);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        handleCancelRename();
      }
    },
    [handleCancelRename, handleCommitRename]
  );

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
      await deleteEditorAsset(pendingDelete.id);
      onItemsChange(items.filter((item) => item.id !== pendingDelete.id));

      if (renamingAssetId === pendingDelete.id) {
        handleCancelRename();
      }

      if (previewItem?.id === pendingDelete.id) {
        setPreviewItem(null);
      }

      setPendingDelete(null);
    } catch (deleteError) {
      setDeleteDialogError(
        deleteError instanceof Error ? deleteError.message : "删除失败"
      );
    } finally {
      setDeletingId(null);
    }
  }, [
    deletingId,
    handleCancelRename,
    items,
    onItemsChange,
    pendingDelete,
    previewItem,
    renamingAssetId,
  ]);

  useEffect(() => {
    if (!previewItem) {
      return;
    }

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewItem(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewItem]);

  return (
    <>
      {errorMessage ? (
        <p className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const isRenaming = renamingAssetId === item.id;
          const showImage = isImageAsset(item) && !brokenImageIds.has(item.id);
          const imageBroken = isImageAsset(item) && brokenImageIds.has(item.id);

          return (
            <article className="group text-center" key={item.id}>
              <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm">
                <div className="relative aspect-square bg-zinc-100">
                  {showImage ? (
                    <Image
                      alt={item.name}
                      className={cn(
                        "object-cover transition",
                        !isRenaming && "group-hover:scale-[1.02]"
                      )}
                      fill
                      onError={() => {
                        setBrokenImageIds((current) =>
                          new Set(current).add(item.id)
                        );
                      }}
                      sizes="(max-width: 640px) 50vw, 25vw"
                      src={item.url}
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-xs font-medium text-zinc-500">
                      {imageBroken ? (
                        <>
                          <span>链接已失效</span>
                          <span className="text-[10px] text-zinc-400">
                            请删除后重新生成
                          </span>
                        </>
                      ) : (
                        (item.mimeType ?? "文件")
                      )}
                    </div>
                  )}

                  {!isRenaming && showImage ? (
                    <div
                      className={cn(
                        "absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 p-2 opacity-0 transition",
                        "group-hover:opacity-100 group-focus-within:opacity-100"
                      )}
                    >
                      <button
                        className="inline-flex w-full max-w-[7.5rem] items-center justify-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-white"
                        onClick={() => setPreviewItem(item)}
                        type="button"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                        {assetLibraryCopy.viewAsset}
                      </button>
                      <button
                        className="inline-flex w-full max-w-[7.5rem] items-center justify-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-white"
                        onClick={() => handleStartRename(item)}
                        type="button"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {assetLibraryCopy.renameAsset}
                      </button>
                      <button
                        className="inline-flex w-full max-w-[7.5rem] items-center justify-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
                        onClick={() => {
                          setDeleteDialogError(null);
                          setPendingDelete({ id: item.id, name: item.name });
                        }}
                        type="button"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {assetLibraryCopy.deleteAsset}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {isRenaming ? (
                <input
                  aria-label={assetLibraryCopy.renamePlaceholder}
                  autoFocus
                  className="mt-1.5 w-full rounded-lg border border-brand-border bg-white px-2 py-1 text-center text-sm text-zinc-800 outline-none ring-2 ring-brand-border/40"
                  onBlur={() => void handleCommitRename(item.id)}
                  onChange={(event) => setRenamingValue(event.target.value)}
                  onKeyDown={(event) => handleRenameKeyDown(event, item.id)}
                  placeholder={assetLibraryCopy.renamePlaceholder}
                  value={renamingValue}
                />
              ) : (
                <div className="space-y-1 p-3">
                  <p
                    className="truncate text-sm font-medium text-zinc-900"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(item.createdAt).toLocaleString("zh-CN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {previewItem ? (
        <div
          className="fixed inset-0 z-70 flex flex-col bg-black/85 p-4"
          onClick={() => setPreviewItem(null)}
          role="presentation"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 pb-3">
            <p
              className="truncate text-sm font-medium text-white"
              title={previewItem.name}
            >
              {previewItem.name}
            </p>
            <button
              aria-label="关闭预览"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-zinc-900 shadow-md ring-1 ring-white/20 transition hover:bg-zinc-100"
              onClick={() => setPreviewItem(null)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={previewItem.name}
              className="mx-auto max-h-full max-w-full object-contain"
              src={previewItem.url}
            />
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          closeOnOverlayClick={false}
          confirmLabel="确定"
          confirmingLabel="删除中…"
          description={`删除后将无法恢复，素材「${pendingDelete.name}」将被永久删除。`}
          errorMessage={deleteDialogError}
          isConfirming={deletingId === pendingDelete.id}
          onCancel={closeDeleteDialog}
          onConfirm={() => void confirmDelete()}
          title="确定删除该素材吗？"
        />
      ) : null}
    </>
  );
}
