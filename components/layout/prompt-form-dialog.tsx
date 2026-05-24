"use client";

import { useCallback, useState } from "react";

import {
  DEFAULT_PROMPT_CATEGORY_SLUG,
  PROMPT_CATEGORY_LABELS,
  PROMPT_CATEGORY_SLUGS,
  type PromptCategorySlug,
} from "@/lib/prompts/category";
import type { SerializedPrompt } from "@/lib/prompts/serialize";
import {
  createEditorPrompt,
  updateEditorPrompt,
} from "@/lib/editor/prompts-api";
import {
  btnCreateAction,
  btnCreateActionDisabled,
  btnEditorHeaderGhost,
} from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type PromptFormDialogProps = {
  prompt: SerializedPrompt | null;
  onClose: () => void;
  onSaved: (prompt: SerializedPrompt) => void;
};

export function PromptFormDialog({
  prompt,
  onClose,
  onSaved,
}: PromptFormDialogProps) {
  const isEditing = Boolean(prompt);
  const formKey = prompt?.id ?? "new";
  const [title, setTitle] = useState(prompt?.title ?? "");
  const [content, setContent] = useState(prompt?.content ?? "");
  const [category, setCategory] = useState<PromptCategorySlug>(
    prompt?.category ?? DEFAULT_PROMPT_CATEGORY_SLUG
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [prevFormKey, setPrevFormKey] = useState(formKey);

  // 切换新建/编辑对象时重置表单，避免在 effect 里同步 state。
  if (formKey !== prevFormKey) {
    setPrevFormKey(formKey);
    setTitle(prompt?.title ?? "");
    setContent(prompt?.content ?? "");
    setCategory(prompt?.category ?? DEFAULT_PROMPT_CATEGORY_SLUG);
    setErrorMessage(null);
  }

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      setErrorMessage("请填写标题和内容");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const saved = isEditing
        ? await updateEditorPrompt(prompt!.id, {
            title: trimmedTitle,
            content: trimmedContent,
            category,
          })
        : await createEditorPrompt({
            title: trimmedTitle,
            content: trimmedContent,
            category,
          });
      onSaved(saved);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  }, [category, content, isEditing, onSaved, prompt, title]);

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="prompt-form-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 className="text-lg font-semibold text-zinc-900" id="prompt-form-title">
          {isEditing ? "编辑 Prompt" : "新建 Prompt"}
        </h2>

        <div className="mt-4 space-y-4">
          <label className="block text-sm font-medium text-zinc-700">
            标题
            <input
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-brand-border focus:ring-2 focus:ring-brand-border/30"
              onChange={(event) => setTitle(event.target.value)}
              placeholder="例如：产品测评文章"
              value={title}
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            分类
            <select
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-brand-border focus:ring-2 focus:ring-brand-border/30"
              onChange={(event) =>
                setCategory(event.target.value as PromptCategorySlug)
              }
              value={category}
            >
              {PROMPT_CATEGORY_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {PROMPT_CATEGORY_LABELS[slug]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Prompt 内容
            <textarea
              className="mt-1.5 min-h-40 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2.5 text-sm leading-6 text-zinc-900 outline-none transition focus:border-brand-border focus:ring-2 focus:ring-brand-border/30"
              onChange={(event) => setContent(event.target.value)}
              placeholder="输入完整的写作指令…"
              value={content}
            />
          </label>
        </div>

        {errorMessage ? (
          <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            className={btnEditorHeaderGhost}
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className={cn(btnCreateAction, btnCreateActionDisabled, "px-4 py-2")}
            disabled={isSaving}
            onClick={() => void handleSave()}
            type="button"
          >
            {isSaving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
