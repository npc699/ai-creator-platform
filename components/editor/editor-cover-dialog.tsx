"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { FolderOpen, ImageIcon, Sparkles, Square, Upload, X } from "lucide-react";

import { assetLibraryCopy } from "@/components/editor/asset-library-copy";
import { insertImageCopy } from "@/components/editor/insert-image-copy";
import { ImageResolutionPicker } from "@/components/editor/ImageResolutionPicker";
import { useEditorContext } from "@/components/editor/editor-context";
import { useAiImageGenerate } from "@/components/editor/use-ai-image-generate";
import { fetchEditorAssets, type EditorAsset } from "@/lib/editor/assets-api";
import { isLocalUploadUrl } from "@/lib/assets/public-url";
import {
  formatLocalImageSize,
  LOCAL_IMAGE_ACCEPT,
  LOCAL_IMAGE_MAX_BYTES,
} from "@/lib/editor/local-image";
import { persistRemoteEditorImage, uploadEditorImage } from "@/lib/editor/upload-image";
import { cn } from "@/lib/utils";
import {
  btnEditorHeaderGhost,
  btnEditorHeaderGhostDisabled,
  btnPrimary,
  btnPrimaryDisabled,
} from "@/lib/utils/brand";
import type { AiImageSize } from "@/lib/ai/image-schema";

type EditorCoverDialogProps = {
  onClose: () => void;
};

type CoverDialogTab = "local" | "ai" | "assets";

export function EditorCoverDialog({ onClose }: EditorCoverDialogProps) {
  const { setCoverUrl, setImageUploading } = useEditorContext();
  const { error, generateImage, isGenerating, reset, stopGenerate } = useAiImageGenerate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<CoverDialogTab>("local");
  const [aiPrompt, setAiPrompt] = useState("");
  const [imageSize, setImageSize] = useState<AiImageSize>("2K");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);
  const [isSavingCover, setIsSavingCover] = useState(false);
  const [saveCoverError, setSaveCoverError] = useState<string | null>(null);
  const [assets, setAssets] = useState<EditorAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState<string | null>(null);

  const showPromptPlaceholder = aiPrompt.length === 0;
  const maxFileSizeLabel = formatLocalImageSize(LOCAL_IMAGE_MAX_BYTES);

  const handleClose = () => {
    stopGenerate();
    reset();
    onClose();
  };

  const handleConfirmUrl = async (url: string) => {
    setSaveCoverError(null);

    try {
      let finalUrl = url;
      // AI 临时外链仅落盘到 uploads，不入素材库。
      if (!isLocalUploadUrl(url)) {
        setIsSavingCover(true);
        const saved = await persistRemoteEditorImage(url);
        finalUrl = saved.url;
      }

      setCoverUrl(finalUrl);
      handleClose();
    } catch (error) {
      setSaveCoverError(
        error instanceof Error ? error.message : "封面保存失败，请稍后重试"
      );
    } finally {
      setIsSavingCover(false);
    }
  };

  const loadAssets = async () => {
    setAssetsLoading(true);
    setAssetsError(null);

    try {
      const list = await fetchEditorAssets();
      setAssets(list.filter((item) => item.url.startsWith("/uploads/")));
    } catch {
      setAssetsError("加载素材失败");
    } finally {
      setAssetsLoading(false);
    }
  };

  const handleTabChange = (tab: CoverDialogTab) => {
    setActiveTab(tab);
    if (tab === "assets") {
      void loadAssets();
    }
  };

  const handlePickLocalImage = () => {
    if (isUploadingLocal) {
      return;
    }

    setLocalError(null);
    fileInputRef.current?.click();
  };

  const handleLocalFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setIsUploadingLocal(true);
    setImageUploading(true);
    setLocalError(null);

    try {
      const uploaded = await uploadEditorImage(file);
      await handleConfirmUrl(uploaded.url);
    } catch (uploadError) {
      setLocalError(
        uploadError instanceof Error ? uploadError.message : assetLibraryCopy.uploadReadFail
      );
    } finally {
      setIsUploadingLocal(false);
      setImageUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) {
      stopGenerate();
      return;
    }

    const trimmedPrompt = aiPrompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    setPreviewUrl(null);
    const url = await generateImage(trimmedPrompt, imageSize);
    if (url) {
      setPreviewUrl(url);
    }
  };

  const handleCancelAiDraft = () => {
    if (isGenerating) {
      stopGenerate();
    }

    setPreviewUrl(null);
    setAiPrompt("");
    reset();
  };

  const handleAiPromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    if (isGenerating) {
      stopGenerate();
      return;
    }

    void handleGenerate();
  };

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/40 p-4"
      onClick={handleClose}
      role="presentation"
    >
      <div
        aria-labelledby="editor-cover-dialog-title"
        aria-modal="true"
        className="max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900" id="editor-cover-dialog-title">
            {insertImageCopy.coverTitle}
          </h2>
          <button
            aria-label={insertImageCopy.close}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100"
            onClick={handleClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1">
          {[
            { label: "本地上传", value: "local" as const, icon: Upload },
            { label: insertImageCopy.tabAi, value: "ai" as const, icon: Sparkles },
            { label: insertImageCopy.tabAssets, value: "assets" as const, icon: FolderOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;

            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition sm:text-sm",
                  isActive
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                type="button"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "local" ? (
          <div className="mt-4 space-y-3">
            <input
              accept={LOCAL_IMAGE_ACCEPT}
              className="hidden"
              onChange={(event) => {
                void handleLocalFileChange(event);
              }}
              ref={fileInputRef}
              type="file"
            />
            <button
              className={cn(
                "flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-[#fdfcf8] px-4 py-8 text-sm transition hover:border-zinc-400 hover:bg-zinc-50",
                isUploadingLocal && "cursor-not-allowed opacity-60"
              )}
              disabled={isUploadingLocal}
              onClick={handlePickLocalImage}
              type="button"
            >
              <Upload className="h-6 w-6 text-zinc-400" />
              <span className="font-medium text-zinc-800">
                {isUploadingLocal ? assetLibraryCopy.uploadReading : insertImageCopy.pickLocal}
              </span>
              <span className="text-xs text-zinc-500">
                {insertImageCopy.formatHint(maxFileSizeLabel)}
              </span>
            </button>
            {localError ? (
              <p className="text-xs leading-5 text-red-600">{localError}</p>
            ) : null}
            <p className="text-xs leading-5 text-zinc-400">{insertImageCopy.coverEmbedTip}</p>
          </div>
        ) : null}

        {activeTab === "ai" ? (
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-zinc-500">
              {assetLibraryCopy.promptLabel}
              <div className="relative mt-2">
                {showPromptPlaceholder ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-3 top-2.5 text-sm leading-6 text-zinc-400"
                  >
                    {assetLibraryCopy.promptPlaceholder}
                  </span>
                ) : null}
                <textarea
                  className="min-h-24 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm leading-6 text-zinc-800 outline-none transition focus:border-brand-border focus:ring-2 focus:ring-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isGenerating}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  onKeyDown={handleAiPromptKeyDown}
                  value={aiPrompt}
                />
              </div>
            </label>

            <ImageResolutionPicker
              disabled={isGenerating}
              onChange={setImageSize}
              value={imageSize}
            />

            {error ? (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-600">
                {error}
              </p>
            ) : null}

            <button
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                isGenerating
                  ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50",
                !aiPrompt.trim() && !isGenerating ? "cursor-not-allowed opacity-60" : null
              )}
              disabled={!aiPrompt.trim() && !isGenerating}
              onClick={() => {
                void handleGenerate();
              }}
              type="button"
            >
              {isGenerating ? (
                <>
                  <Square className="h-4 w-4" />
                  {assetLibraryCopy.stopGenerate}
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" />
                  {assetLibraryCopy.generateImage}
                </>
              )}
            </button>

            <p className="text-xs leading-5 text-zinc-400">{assetLibraryCopy.generateWaitTip}</p>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
              {previewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  alt={aiPrompt.trim() || assetLibraryCopy.previewAlt}
                  className="max-h-44 w-full object-contain"
                  src={previewUrl}
                />
              ) : (
                <div className="flex min-h-36 items-center justify-center bg-gradient-to-br from-violet-100 via-sky-100 to-amber-50 px-4 py-8 text-sm text-zinc-500">
                  {isGenerating
                    ? assetLibraryCopy.previewGenerating
                    : assetLibraryCopy.previewPlaceholder}
                </div>
              )}
            </div>

            {saveCoverError ? (
              <p className="text-xs leading-5 text-red-600">{saveCoverError}</p>
            ) : null}

            {previewUrl ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={cn(
                    btnEditorHeaderGhost,
                    btnEditorHeaderGhostDisabled,
                    "w-full justify-center py-2"
                  )}
                  disabled={isSavingCover}
                  onClick={handleCancelAiDraft}
                  type="button"
                >
                  {assetLibraryCopy.cancel}
                </button>
                <button
                  className={cn(btnPrimary, btnPrimaryDisabled, "w-full justify-center px-3 py-2")}
                  disabled={isGenerating || isSavingCover}
                  onClick={() => {
                    void handleConfirmUrl(previewUrl);
                  }}
                  type="button"
                >
                  {isSavingCover ? insertImageCopy.coverSaving : insertImageCopy.coverConfirm}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {activeTab === "assets" ? (
          <div className="mt-4">
            {assetsLoading ? (
              <p className="py-10 text-center text-sm text-zinc-500">加载中…</p>
            ) : assetsError ? (
              <p className="py-10 text-center text-sm text-red-500">{assetsError}</p>
            ) : assets.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">
                素材库暂无图片，请先上传
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {assets.map((asset) => (
                  <button
                    className={cn(
                      "group relative aspect-[4/3] overflow-hidden rounded-lg border border-zinc-200",
                      "transition hover:border-brand-primary hover:ring-2 hover:ring-brand-primary/30"
                    )}
                    key={asset.id}
                    onClick={() => {
                      void handleConfirmUrl(asset.url);
                    }}
                    type="button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={asset.name}
                      className="h-full w-full object-cover"
                      src={asset.url}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
