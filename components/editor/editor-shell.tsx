"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  AlertTriangle,
  Bot,
  ChevronLeft,
  FileEdit,
  ImageIcon,
  Library,
  Save,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { EditorCoverButton } from "@/components/editor/cover/cover";
import { EditorDraftPanel } from "@/components/editor/draft/draft-panel";
import { EditorTagsButton } from "@/components/editor/tags/tags";
import { AiAssistantPanel } from "@/components/editor/sidebar/ai-panel";
import { AssistantTabPanel } from "@/components/editor/sidebar/assistant-tab-panel";
import { AssetLibraryPanel } from "@/components/editor/sidebar/asset-panel";
import { PromptLibraryPanel } from "@/components/editor/sidebar/prompt-panel";
import {
  EditorProvider,
  useEditorContext,
} from "@/components/editor/editor-context";
import { clearLocalDraft, clearNewDraftLocal } from "@/lib/client";
import { getDraftStorageKey } from "@/lib/drafts/sync";
import { fetchEditorPrompt } from "@/lib/client/prompts/api";
import { getEditorBackTarget, EDITOR_FROM_PARAM } from "@/lib/editor/navigation";
import { cn } from "@/lib/utils";
import {
  btnEditorHeaderGhost,
  btnEditorHeaderGhostDisabled,
} from "@/lib/utils/brand";

function EditorBackLink({
  draftId,
  postId,
}: {
  draftId: string | null;
  postId: string | null;
}) {
  const searchParams = useSearchParams();
  const from = searchParams.get(EDITOR_FROM_PARAM);
  const { href, label } = getEditorBackTarget({ postId, draftId, from });

  return (
    <Link className={btnEditorHeaderGhost} href={href}>
      <ChevronLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}

function EditorDraftPanelTrigger() {
  const { editorMode } = useEditorContext();
  const [isOpen, setIsOpen] = useState(false);

  if (editorMode === "edit") {
    return null;
  }

  return (
    <>
      <button
        className={btnEditorHeaderGhost}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <FileEdit className="h-4 w-4" />
        草稿箱
      </button>
      {isOpen ? <EditorDraftPanel onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}

type ReviewResultPayload = {
  status: "PENDING" | "PASSED" | "REJECTED";
  safety: {
    passed: boolean;
    riskLevel: "high" | "medium" | "low" | "none";
    categories: string[];
    reason: string;
    suggestion: string;
  };
  qualityScore: number | null;
};

type PublishReviewDialogState = {
  type: "blocked";
  reviewResult: ReviewResultPayload;
};

const REVIEW_CATEGORY_LABELS: Record<string, string> = {
  pornography: "涉黄",
  gambling: "涉赌",
  drugs: "涉毒",
  political_sensitive: "政治敏感",
  harassment: "人身攻击",
  vulgar: "低俗内容",
  misinformation: "虚假信息",
};

async function parsePublishError(response: Response) {
  return (await response.json().catch(() => null)) as {
    error?: string;
    reviewResult?: ReviewResultPayload;
  } | null;
}

function ReviewBlockedDialog({
  reviewResult,
  isFixing,
  isBusy,
  onClose,
  onFix,
}: {
  reviewResult: ReviewResultPayload;
  isFixing: boolean;
  isBusy: boolean;
  onClose: () => void;
  onFix: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/30 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-zinc-950">
              内容审核未通过
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {reviewResult.safety.reason}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {reviewResult.safety.categories.map((category) => (
                <span
                  className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600"
                  key={category}
                >
                  {REVIEW_CATEGORY_LABELS[category] ?? category}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              {reviewResult.safety.suggestion}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            disabled={isFixing || isBusy}
            onClick={onClose}
            type="button"
          >
            修改内容
          </button>
          <button
            className="rounded-xl border border-brand-border bg-white px-4 py-2 text-sm font-medium text-brand-primary transition hover:bg-brand-soft"
            disabled={isFixing || isBusy}
            onClick={onFix}
            type="button"
          >
            {isFixing ? "生成中…" : "一键生成合规版本"}
          </button>
        </div>
      </div>
    </div>
  );
}

function useCompliantRewrite() {
  const { editor, title, setTitle, getEditorContent, showNoticeBanner } =
    useEditorContext();
  const [isFixing, setIsFixing] = useState(false);

  const generate = useCallback(
    async (reviewResult: ReviewResultPayload) => {
      if (!editor) return;
      setIsFixing(true);
      try {
        const response = await fetch("/api/review/fix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            content: getEditorContent(),
            reason: reviewResult.safety.reason,
            categories: reviewResult.safety.categories,
          }),
          credentials: "same-origin",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          showNoticeBanner(payload?.error ?? "合规版本生成失败，请稍后重试");
          return false;
        }

        const data = (await response.json()) as {
          fixed: { title: string; content: string };
        };
        setTitle(data.fixed.title);
        editor.commands.setContent(data.fixed.content);
        showNoticeBanner("已生成合规版本，请检查后再发布");
        return true;
      } catch {
        showNoticeBanner("合规版本生成失败，请稍后重试");
        return false;
      } finally {
        setIsFixing(false);
      }
    },
    [editor, getEditorContent, setTitle, showNoticeBanner, title]
  );

  return { isFixing, generate };
}

function EditorPublishButton() {
  const {
    editorMode,
    postId,
    title,
    tags,
    coverUrl,
    draftId,
    userId,
    saveDraft,
    getEditorContent,
    showNoticeBanner,
    saveStatus,
    isUploadingImage,
  } = useEditorContext();
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [reviewDialog, setReviewDialog] =
    useState<PublishReviewDialogState | null>(null);
  const { isFixing, generate: generateCompliant } = useCompliantRewrite();

  const isSaving = saveStatus === "saving";
  const isBusy = isPublishing || isSaving || isUploadingImage;

  const publishCurrentContent = useCallback(async () => {
    const trimmedTitle = title.trim();
    const content = getEditorContent();
    const plainText = content.replace(/<[^>]*>/g, "").trim();

    if (!trimmedTitle) {
      showNoticeBanner("请先输入标题再发布");
      return;
    }

    if (!plainText) {
      showNoticeBanner("请先输入正文再发布");
      return;
    }

    setIsPublishing(true);

    try {
      const saveResult = await saveDraft();
      const publishDraftId =
        (saveResult.ok ? saveResult.draftId : null) ?? draftId;

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          content,
          draftId: publishDraftId,
          tags,
          coverUrl,
        }),
        credentials: "same-origin",
      });

      if (!response.ok) {
        const payload = await parsePublishError(response);
        if (payload?.reviewResult?.status === "REJECTED") {
          setReviewDialog({
            type: "blocked",
            reviewResult: payload.reviewResult,
          });
          return;
        }
        showNoticeBanner(payload?.error ?? "发布失败，请稍后重试");
        return;
      }

      const data = (await response.json()) as {
        post: { id: string };
        reviewResult?: ReviewResultPayload;
      };
      await clearNewDraftLocal(userId);
      const publishedFlag =
        data.reviewResult?.status === "PENDING" ? "pending" : "success";
      router.push(`/posts/${data.post.id}?published=${publishedFlag}`);
    } catch {
      showNoticeBanner("发布失败，请稍后重试");
    } finally {
      setIsPublishing(false);
    }
  }, [
    draftId,
    userId,
    getEditorContent,
    router,
    saveDraft,
    showNoticeBanner,
    tags,
    coverUrl,
    title,
  ]);

  if (editorMode === "edit" && postId) {
    return null;
  }

  return (
    <>
      <button
        className={cn(btnEditorHeaderGhost, btnEditorHeaderGhostDisabled)}
        disabled={isBusy}
        onClick={() => void publishCurrentContent()}
        type="button"
      >
        <Send className="h-4 w-4" />
        {isPublishing ? "正在审核内容…" : "发布文章"}
      </button>

      {reviewDialog ? (
        <ReviewBlockedDialog
          isBusy={isBusy}
          isFixing={isFixing}
          onClose={() => setReviewDialog(null)}
          onFix={() => {
            void generateCompliant(reviewDialog.reviewResult).then((ok) => {
              if (ok) setReviewDialog(null);
            });
          }}
          reviewResult={reviewDialog.reviewResult}
        />
      ) : null}
    </>
  );
}

function EditorPublishUpdateButton() {
  const {
    postId,
    editorMode,
    draftId,
    userId,
    saveDraft,
    showNoticeBanner,
    saveStatus,
    isUploadingImage,
  } = useEditorContext();
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [reviewDialog, setReviewDialog] =
    useState<PublishReviewDialogState | null>(null);
  const { isFixing, generate: generateCompliant } = useCompliantRewrite();

  const isSaving = saveStatus === "saving";
  const isBusy = isPublishing || isSaving || isUploadingImage;

  const handlePublishUpdate = useCallback(async () => {
    if (!postId) return;

    setIsPublishing(true);
    try {
      const saveResult = await saveDraft();
      if (!saveResult.ok && saveResult.reason !== "offline") {
        if (saveResult.reason !== "saving") {
          showNoticeBanner(saveResult.message ?? "保存失败，请稍后重试", "error");
        }
        return;
      }

      const response = await fetch(`/api/posts/${postId}/publish-update`, {
        method: "POST",
        credentials: "same-origin",
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        reviewResult?: ReviewResultPayload;
      } | null;

      if (!response.ok) {
        if (payload?.reviewResult?.status === "REJECTED") {
          setReviewDialog({
            type: "blocked",
            reviewResult: payload.reviewResult,
          });
          return;
        }
        showNoticeBanner(payload?.error ?? "更新发布失败，请稍后重试", "error");
        return;
      }

      const status = payload?.reviewResult?.status;
      const flag = status === "PENDING" ? "pending" : "reviewed";
      if (draftId) {
        await clearLocalDraft(getDraftStorageKey(userId, draftId));
      }
      router.push(`/posts/${postId}?published=${flag}`);
    } catch {
      showNoticeBanner("更新发布失败，请稍后重试", "error");
    } finally {
      setIsPublishing(false);
    }
  }, [postId, draftId, userId, saveDraft, showNoticeBanner, router]);

  if (editorMode !== "edit" || !postId) {
    return null;
  }

  return (
    <>
      <button
        className={cn(btnEditorHeaderGhost, btnEditorHeaderGhostDisabled)}
        disabled={isBusy}
        onClick={() => void handlePublishUpdate()}
        type="button"
      >
        <Send className="h-4 w-4" />
        {isPublishing ? "正在审核…" : "更新发布"}
      </button>

      {reviewDialog ? (
        <ReviewBlockedDialog
          isBusy={isBusy}
          isFixing={isFixing}
          onClose={() => setReviewDialog(null)}
          onFix={() => {
            void generateCompliant(reviewDialog.reviewResult).then((ok) => {
              if (ok) setReviewDialog(null);
            });
          }}
          reviewResult={reviewDialog.reviewResult}
        />
      ) : null}
    </>
  );
}

function EditorManualSaveButton() {
  const { editorMode, saveDraft, saveStatus, showNoticeBanner, isUploadingImage } =
    useEditorContext();
  const isSaving = saveStatus === "saving";
  const isBusy = isSaving || isUploadingImage;
  const isEditMode = editorMode === "edit";

  const handleSave = useCallback(async () => {
    const result = await saveDraft();
    if (!result.ok) {
      if (result.reason === "offline") {
        showNoticeBanner("离线中，内容已本地保存");
      }
      return;
    }
    const savedMessage = isEditMode
      ? result.skipped
        ? "编辑内容已是最新"
        : "编辑已保存，尚未发布"
      : result.skipped
        ? "内容已是最新"
        : "保存成功";
    showNoticeBanner(savedMessage);
  }, [isEditMode, saveDraft, showNoticeBanner]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  return (
    <button
      className={cn(btnEditorHeaderGhost, btnEditorHeaderGhostDisabled)}
      disabled={isBusy}
      onClick={() => void handleSave()}
      type="button"
    >
      <Save className="h-4 w-4" />
      {isUploadingImage ? "图片上传中…" : isSaving ? "保存中…" : "保存"}
    </button>
  );
}

function EditorSaveStatusIndicator() {
  const { saveStatus, lastSavedAt, isOnline, editorMode } = useEditorContext();

  const effectiveStatus =
    !isOnline && saveStatus !== "saving" ? "offline" : saveStatus;

  const dotClass =
    effectiveStatus === "saving"
      ? "bg-amber-500"
      : effectiveStatus === "saved"
        ? "bg-emerald-500"
        : effectiveStatus === "offline"
          ? "bg-amber-500"
          : effectiveStatus === "error"
            ? "bg-red-500"
            : "bg-zinc-300";

  let label = editorMode === "edit" ? "编辑未保存" : "草稿未保存";
  if (effectiveStatus === "saving") {
    label = "保存中…";
  } else if (effectiveStatus === "offline") {
    label = "离线中，内容已本地保存";
  } else if (effectiveStatus === "saved") {
    const savedPrefix = editorMode === "edit" ? "已保存" : "已自动保存";
    label = lastSavedAt
      ? `${savedPrefix} · ${lastSavedAt.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : savedPrefix;
  } else if (effectiveStatus === "error") {
    label = "保存失败，重试中…";
  }

  return (
    <div className="inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-zinc-500">
      <span className={cn("h-2 w-2 rounded-full", dotClass)} />
      {label}
    </div>
  );
}

function EditorNoticeBanner() {
  const { noticeBanner, dismissNoticeBanner } = useEditorContext();

  useEffect(() => {
    if (!noticeBanner) {
      return;
    }
    const timer = window.setTimeout(() => {
      dismissNoticeBanner();
    }, 6000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [dismissNoticeBanner, noticeBanner]);

  if (!noticeBanner) {
    return null;
  }

  const isError = noticeBanner.tone === "error";

  return (
    <div
      aria-live="polite"
      className={cn(
        "flex shrink-0 items-center justify-between gap-3 border-b px-5 py-2 text-sm",
        isError
          ? "border-red-100 bg-red-50/70 text-red-700"
          : "border-emerald-100 bg-emerald-50/70 text-emerald-700"
      )}
    >
      <span>{noticeBanner.message}</span>
      <button
        aria-label="关闭提示"
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-full transition",
          isError
            ? "text-red-600 hover:bg-red-100"
            : "text-emerald-600 hover:bg-emerald-100"
        )}
        onClick={dismissNoticeBanner}
        type="button"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const assistantTabs = [
  { label: "AI 生成", icon: Bot },
  { label: "Prompt 库", icon: Library },
  { label: "素材库", icon: ImageIcon },
] as const;

type AssistantTab = (typeof assistantTabs)[number]["label"];

type EditorShellProps = {
  userId: string;
  children: ReactNode;
};

/** 从路由解析文章 ID；layout 层 useParams 在首次渲染时可能尚未包含子段 [id]。 */
function useEditorPostId() {
  const params = useParams();
  const pathname = usePathname();
  const fromParams = typeof params?.id === "string" ? params.id : null;
  if (fromParams) {
    return fromParams;
  }
  const match = pathname?.match(/^\/editor\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export function EditorShell({ userId, children }: EditorShellProps) {
  const searchParams = useSearchParams();
  const postId = useEditorPostId();
  const initialDraftId = searchParams.get("draftId");
  const promptIdParam = searchParams.get("promptId");
  const [instructionKeyword, setInstructionKeyword] = useState("");
  const [activeAssistantTab, setActiveAssistantTab] =
    useState<AssistantTab>("AI 生成");
  const activeAssistantTabIndex = assistantTabs.findIndex(
    (tab) => tab.label === activeAssistantTab
  );

  useEffect(() => {
    if (!promptIdParam) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const prompt = await fetchEditorPrompt(promptIdParam);
        if (!cancelled) {
          setInstructionKeyword(prompt.content);
          setActiveAssistantTab("AI 生成");
        }
      } catch {
        // promptId 无效时不阻断编辑器
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [promptIdParam]);

  const applyPrompt = useCallback((content: string) => {
    setInstructionKeyword(content);
    setActiveAssistantTab("AI 生成");
  }, []);

  return (
    <EditorProvider
      initialDraftId={initialDraftId}
      postId={postId}
      userId={userId}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
        <header className="flex shrink-0 flex-col gap-5 border-b border-zinc-200/80 bg-white p-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <EditorBackLink draftId={initialDraftId} postId={postId} />
            <EditorDraftPanelTrigger />
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end lg:gap-4">
            <EditorSaveStatusIndicator />
            <EditorCoverButton />
            <EditorTagsButton />
            <EditorManualSaveButton />
            <EditorPublishButton />
            <EditorPublishUpdateButton />
          </div>
        </header>
        <EditorNoticeBanner />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50/60 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]">
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#fdfcf8] lg:min-h-0">
            {children}
          </main>

          <aside className="flex min-h-0 flex-1 flex-col overflow-hidden border-t border-zinc-200/80 bg-white lg:min-h-0 lg:flex-none lg:border-l lg:border-t-0">
            <div className="relative grid h-[61px] shrink-0 grid-cols-3 border-b border-zinc-200/80">
              <div
                aria-hidden
                className="absolute bottom-0 left-0 h-0.5 w-1/3 bg-brand-primary transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
                style={{
                  transform: `translateX(${Math.max(activeAssistantTabIndex, 0) * 100}%)`,
                }}
              />
              {assistantTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeAssistantTab === tab.label;

                return (
                  <button
                    aria-pressed={isActive}
                    className={cn(
                      "relative z-10 inline-flex h-full items-center justify-center gap-2 px-3 text-sm font-medium transition-colors duration-300 ease-out",
                      isActive
                        ? "text-brand-primary"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950"
                    )}
                    key={tab.label}
                    onClick={() => setActiveAssistantTab(tab.label)}
                    type="button"
                  >
                    <Icon
                      className={cn(
                        "hidden h-4 w-4 transition-colors duration-300 ease-out xl:block",
                        isActive ? "text-brand-primary" : "text-zinc-400"
                      )}
                    />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto scroll-stable p-5">
              <AssistantTabPanel<AssistantTab>
                activeKey={activeAssistantTab}
                renderPanel={(tab) => {
                  if (tab === "AI 生成") {
                    return (
                      <AiAssistantPanel
                        keyword={instructionKeyword}
                        onKeywordChange={setInstructionKeyword}
                      />
                    );
                  }

                  if (tab === "Prompt 库") {
                    return <PromptLibraryPanel onApplyPrompt={applyPrompt} />;
                  }

                  return <AssetLibraryPanel />;
                }}
              />
            </div>
          </aside>
        </div>
      </div>
    </EditorProvider>
  );
}
