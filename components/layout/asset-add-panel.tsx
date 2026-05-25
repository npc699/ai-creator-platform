"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";

import {
  CloudUpload,
  ImageIcon,
  Sparkles,
  Square,
  Upload,
  X,
} from "lucide-react";

import {
  AssetLibraryAccordion,
  AssetLibraryValidationStatus,
} from "@/components/editor/asset-library-accordion";
import { assetLibraryCopy } from "@/components/editor/asset-library-copy";
import { ImageResolutionPicker } from "@/components/editor/ImageResolutionPicker";
import { useAiImageGenerate } from "@/components/editor/use-ai-image-generate";
import {
  registerAiImageAsset,
  uploadLocalImageAsset,
  type EditorAsset,
} from "@/lib/editor/assets-api";
import {
  formatLocalImageSize,
  LOCAL_IMAGE_ACCEPT,
  LOCAL_IMAGE_MAX_BYTES,
  validateLocalImageFile,
} from "@/lib/editor/local-image";
import { cn } from "@/lib/utils";
import { btnPrimary, btnPrimaryDisabled } from "@/lib/utils/brand";
import type { AiImageSize } from "@/lib/ai/image-schema";
import { btnEditorHeaderGhost } from "@/lib/utils/brand";

type SectionKey = "upload" | "ai";

type UploadValidationState = {
  fileName: string;
  formatOk: boolean;
  sizeOk: boolean;
  formatMessage: string;
  sizeMessage: string;
  errorMessage: string | null;
};

type UploadDraft = {
  fileName: string;
  previewUrl: string;
  file: File;
};

type AssetAddPanelProps = {
  aiAssetCount: number;
  onAssetAdded: (asset: EditorAsset) => void;
  onClose: () => void;
};

function getFileExtension(filename: string) {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) {
    return "img";
  }

  return filename.slice(dot + 1).toLowerCase();
}

export function AssetAddPanel({
  aiAssetCount,
  onAssetAdded,
  onClose,
}: AssetAddPanelProps) {
  const { error, generateImage, isGenerating, reset, stopGenerate } =
    useAiImageGenerate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    upload: true,
    ai: false,
  });
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<AiImageSize>("2K");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadValidation, setUploadValidation] =
    useState<UploadValidationState | null>(null);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft | null>(null);
  const [isReadingLocal, setIsReadingLocal] = useState(false);

  const showPromptPlaceholder = prompt.length === 0;
  const activePreviewUrl = previewUrl;

  const toggleSection = (key: SectionKey) => {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  };

  useEffect(() => {
    const draftPreviewUrl = uploadDraft?.previewUrl;
    if (!draftPreviewUrl?.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(draftPreviewUrl);
    };
  }, [uploadDraft?.previewUrl]);

  const buildUploadValidation = (file: File): UploadValidationState => {
    const ext = getFileExtension(file.name);
    const sizeLabel = formatLocalImageSize(file.size);
    const maxLabel = formatLocalImageSize(LOCAL_IMAGE_MAX_BYTES);
    const validationError = validateLocalImageFile(file);

    if (validationError === assetLibraryCopy.uploadEmpty) {
      return {
        fileName: file.name,
        formatOk: false,
        sizeOk: false,
        formatMessage: assetLibraryCopy.uploadEmpty,
        sizeMessage: assetLibraryCopy.uploadSizeOk(sizeLabel),
        errorMessage: validationError,
      };
    }

    if (validationError === assetLibraryCopy.uploadSizeFail) {
      return {
        fileName: file.name,
        formatOk: true,
        formatMessage: assetLibraryCopy.uploadFormatOk(ext),
        sizeOk: false,
        sizeMessage: assetLibraryCopy.uploadSizeOver(sizeLabel, maxLabel),
        errorMessage: validationError,
      };
    }

    if (validationError === assetLibraryCopy.uploadFormatFail) {
      return {
        fileName: file.name,
        formatOk: false,
        formatMessage: assetLibraryCopy.uploadFormatFail,
        sizeOk: file.size <= LOCAL_IMAGE_MAX_BYTES,
        sizeMessage:
          file.size <= LOCAL_IMAGE_MAX_BYTES
            ? assetLibraryCopy.uploadSizeOk(sizeLabel)
            : assetLibraryCopy.uploadSizeOver(sizeLabel, maxLabel),
        errorMessage: validationError,
      };
    }

    return {
      fileName: file.name,
      formatOk: true,
      sizeOk: true,
      formatMessage: assetLibraryCopy.uploadFormatOk(ext),
      sizeMessage: assetLibraryCopy.uploadSizeOk(sizeLabel),
      errorMessage: null,
    };
  };

  const clearUploadDraft = () => {
    setUploadDraft(null);
    setUploadValidation(null);
  };

  const processLocalFile = (file: File) => {
    const validation = buildUploadValidation(file);
    setUploadValidation(validation);

    if (validation.errorMessage) {
      clearUploadDraft();
      return;
    }

    setUploadDraft({
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      file,
    });
  };

  const handleCancelUpload = () => {
    if (isReadingLocal) {
      return;
    }

    clearUploadDraft();
  };

  const handleCancelAiDraft = () => {
    if (isGenerating) {
      stopGenerate();
    }

    setPreviewUrl(null);
    setPrompt("");
    reset();
  };

  const handleSaveUploadToLibrary = async () => {
    if (!uploadDraft || isReadingLocal) {
      return;
    }

    setIsReadingLocal(true);

    try {
      const asset = await uploadLocalImageAsset(uploadDraft.file);
      onAssetAdded(asset);
      clearUploadDraft();
      onClose();
    } catch (saveError) {
      setUploadValidation({
        fileName: uploadDraft.fileName,
        formatOk: true,
        sizeOk: true,
        formatMessage: assetLibraryCopy.uploadFormatOk(
          getFileExtension(uploadDraft.fileName)
        ),
        sizeMessage: assetLibraryCopy.uploadSizeOk(
          formatLocalImageSize(uploadDraft.file.size)
        ),
        errorMessage:
          saveError instanceof Error
            ? saveError.message
            : assetLibraryCopy.uploadReadFail,
      });
    } finally {
      setIsReadingLocal(false);
    }
  };

  const handleLocalFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    await processLocalFile(file);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (isReadingLocal) {
      return;
    }

    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }

    await processLocalFile(file);
  };

  const handleGenerate = async () => {
    if (isGenerating) {
      stopGenerate();
      return;
    }

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      return;
    }

    setPreviewUrl(null);
    const url = await generateImage(trimmedPrompt, size);
    if (url) {
      setPreviewUrl(url);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!activePreviewUrl) {
      return;
    }

    try {
      const asset = await registerAiImageAsset(
        assetLibraryCopy.aiGeneratedFileName(aiAssetCount + 1),
        activePreviewUrl
      );
      onAssetAdded(asset);
      handleCancelAiDraft();
      onClose();
    } catch (saveError) {
      reset();
      setPreviewUrl(null);
      console.error(saveError);
    }
  };

  const handlePromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handleGenerate();
    }
  };

  return (
  <>
    <div
      className="fixed inset-0 z-50 bg-black/30"
      onClick={onClose}
      role="presentation"
    />
    <aside
      aria-label="添加素材"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-200/80 bg-white shadow-xl"
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/80 px-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Upload className="h-4 w-4" />
          添加素材
        </div>
        <button
          aria-label="关闭"
          className={btnEditorHeaderGhost}
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          <AssetLibraryAccordion
            expanded={expanded.upload}
            icon={Upload}
            onToggle={() => toggleSection("upload")}
            title={assetLibraryCopy.uploadTitle}
          >
            <input
              accept={LOCAL_IMAGE_ACCEPT}
              className="hidden"
              onChange={(event) => {
                void handleLocalFileChange(event);
              }}
              ref={fileInputRef}
              type="file"
            />

            <div
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-[#fdfcf8] px-4 py-7 text-center transition",
                isReadingLocal
                  ? "cursor-wait opacity-70"
                  : "cursor-pointer hover:border-zinc-400 hover:bg-zinc-50"
              )}
              onDragOver={(event) => {
                event.preventDefault();
              }}
              onDrop={(event) => {
                void handleDrop(event);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  if (!isReadingLocal) {
                    fileInputRef.current?.click();
                  }
                }
              }}
              onClick={() => {
                if (!isReadingLocal) {
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <CloudUpload className="h-7 w-7 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-800">
                {isReadingLocal
                  ? assetLibraryCopy.uploadReading
                  : assetLibraryCopy.uploadHint}
              </p>
              <p className="text-xs text-zinc-500">
                {assetLibraryCopy.uploadFormats}
              </p>
            </div>

            {uploadValidation ? (
              <div className="mt-3 space-y-2">
                <AssetLibraryValidationStatus
                  message={uploadValidation.formatMessage}
                  ok={uploadValidation.formatOk}
                />
                <AssetLibraryValidationStatus
                  message={uploadValidation.sizeMessage}
                  ok={uploadValidation.sizeOk}
                />
                {uploadValidation.errorMessage ? (
                  <AssetLibraryValidationStatus
                    message={uploadValidation.errorMessage}
                    ok={false}
                  />
                ) : null}
              </div>
            ) : null}

            {uploadDraft ? (
              <>
                <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={uploadDraft.fileName || assetLibraryCopy.uploadPreviewAlt}
                    className="max-h-44 w-full object-contain"
                    src={uploadDraft.previewUrl}
                  />
                </div>
                <p className="mt-2 truncate text-center text-xs text-zinc-500">
                  {uploadDraft.fileName}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isReadingLocal}
                    onClick={handleCancelUpload}
                    onPointerDown={(event) => {
                      event.preventDefault();
                    }}
                    type="button"
                  >
                    {assetLibraryCopy.cancel}
                  </button>
                  <button
                    className={cn(btnPrimary, "px-3 py-2", isReadingLocal && "opacity-60")}
                    disabled={isReadingLocal}
                    onClick={() => {
                      void handleSaveUploadToLibrary();
                    }}
                    onPointerDown={(event) => {
                      event.preventDefault();
                    }}
                    type="button"
                  >
                    {isReadingLocal
                      ? assetLibraryCopy.savingToLibrary
                      : assetLibraryCopy.saveToLibrary}
                  </button>
                </div>
              </>
            ) : null}
          </AssetLibraryAccordion>

          <AssetLibraryAccordion
            expanded={expanded.ai}
            icon={Sparkles}
            onToggle={() => toggleSection("ai")}
            title={assetLibraryCopy.aiTitle}
          >
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
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={handlePromptKeyDown}
                  value={prompt}
                />
              </div>
            </label>

            <div className="mt-3">
              <ImageResolutionPicker
                disabled={isGenerating}
                onChange={setSize}
                value={size}
              />
            </div>

            {error ? (
              <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-600">
                {error}
              </p>
            ) : null}

            <button
              className={cn(
                "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
                isGenerating
                  ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50",
                !prompt.trim() && !isGenerating ? "cursor-not-allowed opacity-60" : null
              )}
              disabled={!prompt.trim() && !isGenerating}
              onClick={() => {
                void handleGenerate();
              }}
              onPointerDown={(event) => {
                event.preventDefault();
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

            <p className="mt-2 text-xs leading-5 text-zinc-400">
              {assetLibraryCopy.generateWaitTip}
            </p>

            <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
              {activePreviewUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  alt={prompt.trim() || assetLibraryCopy.previewAlt}
                  className="max-h-44 w-full object-contain"
                  src={activePreviewUrl}
                />
              ) : (
                <div className="flex min-h-36 items-center justify-center bg-gradient-to-br from-violet-100 via-sky-100 to-amber-50 px-4 py-8 text-sm text-zinc-500">
                  {isGenerating
                    ? assetLibraryCopy.previewGenerating
                    : assetLibraryCopy.previewPlaceholder}
                </div>
              )}
            </div>

            {activePreviewUrl ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  onClick={handleCancelAiDraft}
                  onPointerDown={(event) => {
                    event.preventDefault();
                  }}
                  type="button"
                >
                  {assetLibraryCopy.cancel}
                </button>
                <button
                  className={cn(btnPrimary, btnPrimaryDisabled, "px-3 py-2")}
                  disabled={isGenerating}
                  onClick={() => {
                    void handleSaveToLibrary();
                  }}
                  onPointerDown={(event) => {
                    event.preventDefault();
                  }}
                  type="button"
                >
                  {assetLibraryCopy.saveToLibrary}
                </button>
              </div>
            ) : null}
          </AssetLibraryAccordion>
        </div>
      </div>
    </aside>
  </>
  );
}
