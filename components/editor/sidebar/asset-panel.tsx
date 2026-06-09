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
  Grid2x2,
  ImageIcon,
  Pencil,
  Sparkles,
  Square,
  Trash2,
  Upload,
} from "lucide-react";

import { useEditorContext } from "@/components/editor/editor-context";
import {
  assetLibraryCopy,
  MediaAccordion,
  MediaValidationStatus,
  MediaResolutionPicker,
  useAiImageGenerate,
} from "@/components/media";
import {
  deleteEditorAsset,
  fetchEditorAssets,
  registerAiImageAsset,
  renameEditorAsset,
  uploadLocalImageAsset,
  type EditorAsset,
} from "@/lib/client/assets/api";
import {
  formatLocalImageSize,
  LOCAL_IMAGE_ACCEPT,
  LOCAL_IMAGE_MAX_BYTES,
  validateLocalImageFile,
} from "@/lib/editor/image/local-image";
import { cn } from "@/lib/utils";
import { btnPrimary, btnPrimaryDisabled } from "@/lib/utils/brand";
import type { AiImageSize } from "@/lib/ai/image-schema";

type LibraryAsset = {
  id: string;
  name: string;
  url: string;
  source: "upload" | "ai";
  createdAt: number;
};

function toLibraryAsset(asset: EditorAsset): LibraryAsset {
  return {
    id: asset.id,
    name: asset.name,
    url: asset.url,
    source: asset.source === "AI" ? "ai" : "upload",
    createdAt: new Date(asset.createdAt).getTime(),
  };
}

type SectionKey = "upload" | "ai" | "assets";

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
  /** ??? blob URL????????????? */
  previewUrl: string;
  file: File;
};

function getFileExtension(filename: string) {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) {
    return "img";
  }

  return filename.slice(dot + 1).toLowerCase();
}

function nextAiAssetName(existing: LibraryAsset[]) {
  const aiCount = existing.filter((item) => item.source === "ai").length;
  return assetLibraryCopy.aiGeneratedFileName(aiCount + 1);
}

export function AssetLibraryPanel() {
  const { editor, insertImage } = useEditorContext();
  const { error, generateImage, isGenerating, reset, stopGenerate } = useAiImageGenerate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    upload: false,
    ai: false,
    assets: true,
  });
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<AiImageSize>("2K");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [uploadValidation, setUploadValidation] = useState<UploadValidationState | null>(
    null
  );
  const [uploadDraft, setUploadDraft] = useState<UploadDraft | null>(null);
  const [isReadingLocal, setIsReadingLocal] = useState(false);
  const [renamingAssetId, setRenamingAssetId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);

  const isEditorReady = Boolean(editor);
  const showPromptPlaceholder = prompt.length === 0;
  const activePreviewUrl = previewUrl;

  const toggleSection = (key: SectionKey) => {
    setExpanded((current) => ({ ...current, [key]: !current[key] }));
  };

  // ??/??????? blob URL????????
  useEffect(() => {
    const previewUrl = uploadDraft?.previewUrl;
    if (!previewUrl?.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [uploadDraft?.previewUrl]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const list = await fetchEditorAssets();
        if (!cancelled) {
          setAssets(list.map(toLibraryAsset));
        }
      } catch (error) {
        if (!cancelled) {
          setAssetsError(error instanceof Error ? error.message : "??????");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAssets(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const prependAsset = (asset: EditorAsset) => {
    const mapped = toLibraryAsset(asset);
    setAssets((current) => {
      if (current.some((item) => item.id === mapped.id)) {
        return current;
      }
      return [mapped, ...current];
    });
  };

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

    // ??????????????????? /api/assets ???
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
      prependAsset(asset);
      setExpanded((current) => ({ ...current, assets: true }));
      clearUploadDraft();
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
          saveError instanceof Error ? saveError.message : assetLibraryCopy.uploadReadFail,
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
        nextAiAssetName(assets),
        activePreviewUrl
      );
      prependAsset(asset);
      setExpanded((current) => ({ ...current, assets: true }));
      setPreviewUrl(null);
      setPrompt("");
    } catch (saveError) {
      setAssetsError(
        saveError instanceof Error ? saveError.message : "???????"
      );
    }
  };

  const handleInsert = (url: string) => {
    insertImage(url);
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      await deleteEditorAsset(id);
      setAssets((current) => current.filter((item) => item.id !== id));

      if (renamingAssetId === id) {
        setRenamingAssetId(null);
        setRenamingValue("");
      }
    } catch (deleteError) {
      setAssetsError(
        deleteError instanceof Error ? deleteError.message : "??????"
      );
    }
  };

  const handleStartRename = (item: LibraryAsset) => {
    setRenamingAssetId(item.id);
    setRenamingValue(item.name);
  };

  const handleCommitRename = async (id: string) => {
    const trimmed = renamingValue.trim();

    if (!trimmed) {
      setRenamingAssetId(null);
      setRenamingValue("");
      return;
    }

    try {
      const updated = await renameEditorAsset(id, trimmed);
      setAssets((current) =>
        current.map((item) =>
          item.id === id ? toLibraryAsset(updated) : item
        )
      );
      setRenamingAssetId(null);
      setRenamingValue("");
    } catch (renameError) {
      setAssetsError(
        renameError instanceof Error ? renameError.message : "?????"
      );
    }
  };

  const handleCancelRename = () => {
    setRenamingAssetId(null);
    setRenamingValue("");
  };

  const handleRenameKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    id: string
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCommitRename(id);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      handleCancelRename();
    }
  };

  const handlePromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
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
    <div className="space-y-2">
      <MediaAccordion
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
            isReadingLocal ? "cursor-wait opacity-70" : "cursor-pointer hover:border-zinc-400 hover:bg-zinc-50"
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
            {isReadingLocal ? assetLibraryCopy.uploadReading : assetLibraryCopy.uploadHint}
          </p>
          <p className="text-xs text-zinc-500">{assetLibraryCopy.uploadFormats}</p>
        </div>

        {uploadValidation ? (
          <div className="mt-3 space-y-2">
            <MediaValidationStatus
              message={uploadValidation.formatMessage}
              ok={uploadValidation.formatOk}
            />
            <MediaValidationStatus
              message={uploadValidation.sizeMessage}
              ok={uploadValidation.sizeOk}
            />
            {uploadValidation.errorMessage ? (
              <MediaValidationStatus
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
            <p className="mt-2 truncate text-center text-xs text-zinc-500">{uploadDraft.fileName}</p>
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
                {isReadingLocal ? assetLibraryCopy.savingToLibrary : assetLibraryCopy.saveToLibrary}
              </button>
            </div>
          </>
        ) : null}
      </MediaAccordion>

      <MediaAccordion
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
          <MediaResolutionPicker
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

        <p className="mt-2 text-xs leading-5 text-zinc-400">{assetLibraryCopy.generateWaitTip}</p>

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
      </MediaAccordion>

      <MediaAccordion
        badge={assets.length}
        expanded={expanded.assets}
        icon={Grid2x2}
        onToggle={() => toggleSection("assets")}
        title={assetLibraryCopy.myAssetsTitle}
      >
        {assetsError ? (
          <p className="py-4 text-center text-xs leading-5 text-red-600">{assetsError}</p>
        ) : null}
        {isLoadingAssets ? (
          <p className="py-6 text-center text-xs leading-5 text-zinc-400">??????</p>
        ) : assets.length === 0 ? (
          <p className="py-6 text-center text-xs leading-5 text-zinc-400">
            {assetLibraryCopy.myAssetsEmpty}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {assets.map((item) => {
                const isRenaming = renamingAssetId === item.id;

                return (
                  <div className="group text-center" key={item.id}>
                    <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={item.name}
                        className={cn(
                          "aspect-square w-full object-cover transition",
                          !isRenaming && "group-hover:scale-[1.02]"
                        )}
                        src={item.url}
                      />
                      {!isRenaming ? (
                        <div
                          className={cn(
                            "absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 p-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
                          )}
                        >
                          <button
                            className={cn(
                              "inline-flex w-full max-w-[7.5rem] items-center justify-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100",
                              !isEditorReady && "cursor-not-allowed opacity-60"
                            )}
                            disabled={!isEditorReady}
                            onClick={() => handleInsert(item.url)}
                            onPointerDown={(event) => {
                              event.preventDefault();
                            }}
                            type="button"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            {assetLibraryCopy.insertToEditor}
                          </button>
                          <button
                            className="inline-flex w-full max-w-[7.5rem] items-center justify-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-white"
                            onClick={() => handleStartRename(item)}
                            onPointerDown={(event) => {
                              event.preventDefault();
                            }}
                            type="button"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            {assetLibraryCopy.renameAsset}
                          </button>
                          <button
                            className="inline-flex w-full max-w-[7.5rem] items-center justify-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
                            onClick={() => {
                              void handleDeleteAsset(item.id);
                            }}
                            onPointerDown={(event) => {
                              event.preventDefault();
                            }}
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {assetLibraryCopy.deleteAsset}
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {isRenaming ? (
                      <input
                        aria-label={assetLibraryCopy.renamePlaceholder}
                        autoFocus
                        className="mt-1.5 w-full rounded-lg border border-brand-border bg-white px-2 py-1 text-center text-xs text-zinc-800 outline-none ring-2 ring-brand-border/40"
                        onBlur={() => handleCommitRename(item.id)}
                        onChange={(event) => setRenamingValue(event.target.value)}
                        onKeyDown={(event) => handleRenameKeyDown(event, item.id)}
                        onPointerDown={(event) => {
                          event.stopPropagation();
                        }}
                        placeholder={assetLibraryCopy.renamePlaceholder}
                        value={renamingValue}
                      />
                    ) : (
                      <p className="mt-1.5 truncate px-0.5 text-xs text-zinc-600" title={item.name}>
                        {item.name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </MediaAccordion>
    </div>
  );
}
