"use client";

import { Tags, X } from "lucide-react";
import { useCallback, useState, type KeyboardEvent } from "react";

import { useEditorContext } from "@/components/editor/editor-context";
import {
  canAddPostTag,
  normalizePostTag,
  POST_MAX_TAGS,
  POST_MAX_TAG_LENGTH,
} from "@/lib/posts/tags";
import {
  badgeArticleTag,
  btnEditorHeaderGhost,
  btnEditorHeaderGhostDisabled,
  btnPrimary,
  btnPrimaryDisabled,
} from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

/** 标题下方展示文章标签，悬停可删除。 */
export function EditorPostTagsDisplay() {
  const { tags, removeTag } = useEditorContext();

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          className={cn(badgeArticleTag, "group/tag inline-flex items-center gap-1")}
          key={tag}
        >
          {tag}
          <button
            aria-label={`移除标签 ${tag}`}
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-zinc-500 opacity-0 transition hover:bg-zinc-200/80 hover:text-zinc-800 group-hover/tag:opacity-100"
            onClick={() => removeTag(tag)}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

type EditorTagsDialogProps = {
  open: boolean;
  onClose: () => void;
};

function EditorTagsDialog({ open, onClose }: EditorTagsDialogProps) {
  if (!open) {
    return null;
  }

  return <EditorTagsDialogContent onClose={onClose} />;
}

function EditorTagsDialogContent({ onClose }: { onClose: () => void }) {
  const { tags, setTags } = useEditorContext();
  const [draftTags, setDraftTags] = useState(tags);
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const commitInput = useCallback(() => {
    const normalized = normalizePostTag(inputValue);
    if (!normalized.ok) {
      setErrorMessage(normalized.message);
      return;
    }

    const canAdd = canAddPostTag(draftTags, normalized.tag);
    if (!canAdd.ok) {
      setErrorMessage(canAdd.message);
      return;
    }

    setDraftTags([...draftTags, normalized.tag]);
    setInputValue("");
    setErrorMessage(null);
  }, [draftTags, inputValue]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitInput();
    }
  };

  const handleConfirm = () => {
    setTags(draftTags);
    onClose();
  };

  const canAddMore = draftTags.length < POST_MAX_TAGS;

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="editor-tags-dialog-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2
          className="text-lg font-semibold text-zinc-900"
          id="editor-tags-dialog-title"
        >
          编辑文章标签
        </h2>

        <div className="mt-4 min-h-[2.5rem]">
          {draftTags.length === 0 ? (
            <p className="text-sm text-zinc-400">暂未添加标签</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {draftTags.map((tag) => (
                <span
                  className={cn(badgeArticleTag, "inline-flex items-center gap-1")}
                  key={tag}
                >
                  {tag}
                  <button
                    aria-label={`移除标签 ${tag}`}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-200/80 hover:text-zinc-800"
                    onClick={() => {
                      setDraftTags(draftTags.filter((item) => item !== tag));
                      setErrorMessage(null);
                    }}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {canAddMore ? (
          <div className="mt-4 flex gap-2">
            <input
              aria-label="新标签"
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-brand-border focus:ring-2 focus:ring-brand-border/30"
              onChange={(event) => {
                setInputValue(event.target.value);
                if (errorMessage) {
                  setErrorMessage(null);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="输入后按 Enter 添加"
              type="text"
              value={inputValue}
            />
            <button
              className={btnEditorHeaderGhost}
              onClick={commitInput}
              type="button"
            >
              添加
            </button>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="mt-2 text-xs text-red-600">{errorMessage}</p>
        ) : (
          <p className="mt-2 text-xs text-zinc-400">
            最多 {POST_MAX_TAGS} 个，每个不超过 {POST_MAX_TAG_LENGTH} 字
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button className={btnEditorHeaderGhost} onClick={onClose} type="button">
            取消
          </button>
          <button
            className={cn(btnPrimary, btnPrimaryDisabled, "px-4 py-2")}
            onClick={handleConfirm}
            type="button"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

/** 编辑器顶栏「标签」按钮，位于保存状态与保存按钮之间。 */
export function EditorTagsButton() {
  const { saveStatus, isUploadingImage } = useEditorContext();
  const [dialogOpen, setDialogOpen] = useState(false);

  const isSaving = saveStatus === "saving";
  const isBusy = isSaving || isUploadingImage;

  return (
    <>
      <button
        className={cn(btnEditorHeaderGhost, btnEditorHeaderGhostDisabled)}
        disabled={isBusy}
        onClick={() => setDialogOpen(true)}
        type="button"
      >
        <Tags className="h-4 w-4" />
        标签
      </button>
      <EditorTagsDialog onClose={() => setDialogOpen(false)} open={dialogOpen} />
    </>
  );
}
