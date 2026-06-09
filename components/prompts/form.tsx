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
} from "@/lib/client/prompts/api";
import {
  btnCreateAction,
  btnCreateActionDisabled,
  btnEditorHeaderGhost,
  btnPrimary,
  btnPrimaryDisabled,
} from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type PromptFormFieldsProps = {
  title: string;
  content: string;
  category: PromptCategorySlug;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onCategoryChange: (value: PromptCategorySlug) => void;
  errorMessage?: string | null;
  variant?: "dialog" | "inline";
  isEditing?: boolean;
  isSaving?: boolean;
  onCancel?: () => void;
  onSave?: () => void;
};

export function PromptFormFields({
  title,
  content,
  category,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  errorMessage,
  variant = "dialog",
  isEditing = false,
  isSaving = false,
  onCancel,
  onSave,
}: PromptFormFieldsProps) {
  const isInline = variant === "inline";

  const inputClass = isInline
    ? "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-border focus:ring-2 focus:ring-brand-border/30"
    : "mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-brand-border focus:ring-2 focus:ring-brand-border/30";

  const textareaClass = isInline
    ? "min-h-24 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-brand-border focus:ring-2 focus:ring-brand-border/30"
    : "mt-1.5 min-h-40 w-full resize-y rounded-xl border border-zinc-200 px-3 py-2.5 text-sm leading-6 text-zinc-900 outline-none transition focus:border-brand-border focus:ring-2 focus:ring-brand-border/30";

  const fields = isInline ? (
    <>
      <input
        className={inputClass}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="标题"
        value={title}
      />
      <select
        className={inputClass}
        onChange={(event) =>
          onCategoryChange(event.target.value as PromptCategorySlug)
        }
        value={category}
      >
        {PROMPT_CATEGORY_SLUGS.map((slug) => (
          <option key={slug} value={slug}>
            {PROMPT_CATEGORY_LABELS[slug]}
          </option>
        ))}
      </select>
      <textarea
        className={textareaClass}
        onChange={(event) => onContentChange(event.target.value)}
        placeholder="Prompt 内容"
        value={content}
      />
    </>
  ) : (
    <>
      <label className="block text-sm font-medium text-zinc-700">
        标题
        <input
          className={inputClass}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="例如：产品测评文章"
          value={title}
        />
      </label>

      <label className="block text-sm font-medium text-zinc-700">
        分类
        <select
          className={cn(inputClass, "bg-white")}
          onChange={(event) =>
            onCategoryChange(event.target.value as PromptCategorySlug)
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
          className={textareaClass}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder="输入完整的写作指令…"
          value={content}
        />
      </label>
    </>
  );

  return (
    <div className={isInline ? "space-y-3" : "mt-4 space-y-4"}>
      {isInline ? (
        <p className="text-xs font-medium text-zinc-600">
          {isEditing ? "编辑 Prompt" : "新建 Prompt"}
        </p>
      ) : null}
      {fields}
      {errorMessage ? (
        <p
          className={
            isInline
              ? "text-xs text-red-600"
              : "mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600"
          }
        >
          {errorMessage}
        </p>
      ) : null}
      {onCancel && onSave ? (
        isInline ? (
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
              disabled={isSaving}
              onClick={onCancel}
              type="button"
            >
              取消
            </button>
            <button
              className={cn(btnPrimary, btnPrimaryDisabled, "flex-1 px-3 py-2")}
              disabled={isSaving}
              onClick={onSave}
              type="button"
            >
              {isSaving ? "保存中…" : "保存"}
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              className={btnEditorHeaderGhost}
              disabled={isSaving}
              onClick={onCancel}
              type="button"
            >
              取消
            </button>
            <button
              className={cn(btnCreateAction, btnCreateActionDisabled, "px-4 py-2")}
              disabled={isSaving}
              onClick={onSave}
              type="button"
            >
              {isSaving ? "保存中…" : "保存"}
            </button>
          </div>
        )
      ) : null}
    </div>
  );
}

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

        <PromptFormFields
          category={category}
          content={content}
          errorMessage={errorMessage}
          isEditing={isEditing}
          isSaving={isSaving}
          onCancel={onClose}
          onCategoryChange={setCategory}
          onContentChange={setContent}
          onSave={() => void handleSave()}
          onTitleChange={setTitle}
          title={title}
          variant="dialog"
        />
      </div>
    </div>
  );
}
