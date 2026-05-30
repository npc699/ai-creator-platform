"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { ImageIcon, Sparkles, Square, Upload, X } from "lucide-react";

import { assetLibraryCopy } from "@/components/editor/asset-library-copy";
import { insertImageCopy } from "@/components/editor/insert-image-copy";
import { ImageResolutionPicker } from "@/components/editor/ImageResolutionPicker";
import { useEditorContext } from "@/components/editor/editor-context";
import { useAiImageGenerate } from "@/components/editor/use-ai-image-generate";
import {
  formatLocalImageSize,
  LOCAL_IMAGE_ACCEPT,
  LOCAL_IMAGE_MAX_BYTES,
} from "@/lib/editor/local-image";
import { uploadEditorImage } from "@/lib/editor/upload-image";
import { cn } from "@/lib/utils";
import { btnPrimary, btnPrimaryDisabled } from "@/lib/utils/brand";
import type { AiImageSize } from "@/lib/ai/image-schema";

type InsertImageDialogProps = {
  onClose: () => void;
  /** 自定义确认；未传时默认插入编辑器正文。 */
  onConfirm?: (url: string) => void;
  title?: string;
  confirmLabel?: string;
  embedTip?: string;
  /** 封面等场景不依赖编辑器实例。 */
  requireEditor?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

type InsertImageTab = "local" | "ai";

export function InsertImageDialog({
  onClose,
  onConfirm,
  title,
  confirmLabel,
  embedTip,
  requireEditor = true,
  onUploadingChange,
}: InsertImageDialogProps) {
  const { editor, insertImage } = useEditorContext();
  const { error, generateImage, isGenerating, reset, stopGenerate } = useAiImageGenerate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<InsertImageTab>("local");
  const [aiPrompt, setAiPrompt] = useState("");
  const [imageSize, setImageSize] = useState<AiImageSize>("2K");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isUploadingLocal, setIsUploadingLocal] = useState(false);

  const isEditorReady = requireEditor ? Boolean(editor) : true;
  const dialogTitle = title ?? insertImageCopy.title;
  const dialogConfirmLabel = confirmLabel ?? assetLibraryCopy.insertToEditor;
  const dialogEmbedTip = embedTip ?? insertImageCopy.embedTip;
  const showPromptPlaceholder = aiPrompt.length === 0;
  const maxFileSizeLabel = formatLocalImageSize(LOCAL_IMAGE_MAX_BYTES);

  const handleClose = () => {
    stopGenerate();
    onClose();
  };

  const handleConfirmUrl = (url: string) => {
    if (onConfirm) {
      onConfirm(url);
      handleClose();
      return;
    }

    if (!insertImage(url)) {
      return;
    }

    handleClose();
  };

  const handlePickLocalImage = () => {
    if (!isEditorReady || isUploadingLocal) {
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
    onUploadingChange?.(true);
    setLocalError(null);

    try {
      const uploaded = await uploadEditorImage(file);

      if (onConfirm) {
        onConfirm(uploaded.url);
        handleClose();
        return;
      }

      if (!insertImage(uploaded.url, file.name)) {
        setLocalError(assetLibraryCopy.uploadEditorNotReady);
        return;
      }

      handleClose();
    } catch (uploadError) {
      setLocalError(
        uploadError instanceof Error ? uploadError.message : assetLibraryCopy.uploadReadFail
      );
    } finally {
      setIsUploadingLocal(false);
      onUploadingChange?.(false);
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

  const handleInsertPreview = () => {
    if (!previewUrl || !isEditorReady) {
      return;
    }

    handleConfirmUrl(previewUrl);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onPointerDown={handleClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
        onPointerDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-labelledby="insert-image-title"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-900" id="insert-image-title">
            {dialogTitle}
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

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1">
          {[
            { label: insertImageCopy.tabLocal, value: "local" as const, icon: Upload },
            { label: insertImageCopy.tabAi, value: "ai" as const, icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.value;

            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                )}
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                type="button"
              >
                <Icon className="h-4 w-4" />
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
                (!isEditorReady || isUploadingLocal) && "cursor-not-allowed opacity-60"
              )}
              disabled={!isEditorReady || isUploadingLocal}
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
            <p className="text-xs leading-5 text-zinc-400">{dialogEmbedTip}</p>
          </div>
        ) : (
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

            {previewUrl ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  onClick={handleCancelAiDraft}
                  type="button"
                >
                  {assetLibraryCopy.cancel}
                </button>
                <button
                  className={cn(btnPrimary, btnPrimaryDisabled, "px-3 py-2")}
                  disabled={isGenerating || !isEditorReady}
                  onClick={handleInsertPreview}
                  type="button"
                >
                  {dialogConfirmLabel}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
