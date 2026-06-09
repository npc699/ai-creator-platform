"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PromptCard,
  PromptFilterTabs,
  PromptFormFields,
} from "@/components/prompts";
import { ConfirmDialog } from "@/components/ui";
import type { PromptCategory } from "@/lib/prompts/panel-params";
import {
  DEFAULT_PROMPT_CATEGORY_SLUG,
  type PromptCategorySlug,
} from "@/lib/prompts/category";
import type { SerializedPrompt } from "@/lib/prompts/serialize";
import {
  EDITOR_PROMPT_SCOPES,
  EDITOR_PROMPT_SCOPE_OPTIONS,
  type EditorPromptScope,
} from "@/lib/prompts/query";
import {
  createEditorPrompt,
  deleteEditorPrompt,
  fetchEditorPrompts,
  recordEditorPromptUse,
  updateEditorPrompt,
} from "@/lib/client/prompts/api";
import { btnEditorHeaderGhost } from "@/lib/utils/brand";

type PromptLibraryPanelProps = {
  onApplyPrompt: (content: string) => void;
};

type PendingDelete = {
  id: string;
  title: string;
};

type ScopeLists = Record<EditorPromptScope, SerializedPrompt[]>;

const EMPTY_LISTS: ScopeLists = { mine: [], favorite: [] };

function filterByCategory(
  prompts: SerializedPrompt[],
  category: PromptCategory
): SerializedPrompt[] {
  if (category === "all") {
    return prompts;
  }

  return prompts.filter((prompt) => prompt.category === category);
}

export function PromptLibraryPanel({ onApplyPrompt }: PromptLibraryPanelProps) {
  const [scope, setScope] = useState<EditorPromptScope>("mine");
  const [category, setCategory] = useState<PromptCategory>("all");
  const [lists, setLists] = useState<ScopeLists>(EMPTY_LISTS);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formCategory, setFormCategory] = useState<PromptCategorySlug>(
    DEFAULT_PROMPT_CATEGORY_SLUG
  );
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const entries = await Promise.all(
          EDITOR_PROMPT_SCOPES.map(
            async (scopeKey) =>
              [scopeKey, await fetchEditorPrompts(scopeKey)] as const
          )
        );

        if (cancelled) {
          return;
        }

        setLists(
          entries.reduce<ScopeLists>(
            (acc, [scopeKey, list]) => {
              acc[scopeKey] = list;
              return acc;
            },
            { mine: [], favorite: [] }
          )
        );
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "加载失败");
        }
      } finally {
        if (!cancelled) {
          setIsInitialLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!copyNotice) {
      return;
    }

    const timer = window.setTimeout(() => setCopyNotice(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copyNotice]);

  const visiblePrompts = useMemo(
    () => filterByCategory(lists[scope], category),
    [category, lists, scope]
  );

  const emptyMessage = useMemo(() => {
    if (category !== "all") {
      return "该分类下暂无 Prompt";
    }

    return scope === "favorite"
      ? "暂无收藏的官方 Prompt"
      : "暂无 Prompt，点击新增创建";
  }, [category, scope]);

  const resetForm = useCallback(() => {
    setTitle("");
    setContent("");
    setFormCategory(DEFAULT_PROMPT_CATEGORY_SLUG);
    setEditingPromptId(null);
    setFormError(null);
    setShowCreateForm(false);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      setFormError("请填写标题和内容");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const saved = editingPromptId
        ? await updateEditorPrompt(editingPromptId, {
            title: trimmedTitle,
            content: trimmedContent,
            category: formCategory,
          })
        : await createEditorPrompt({
            title: trimmedTitle,
            content: trimmedContent,
            category: formCategory,
          });

      setLists((current) => ({
        ...current,
        mine: [saved, ...current.mine.filter((item) => item.id !== saved.id)],
      }));
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  }, [editingPromptId, formCategory, content, resetForm, title]);

  const handleApply = useCallback(
    async (prompt: SerializedPrompt) => {
      try {
        const updated = await recordEditorPromptUse(prompt.id);
        const targetScope = prompt.isOfficial ? "favorite" : "mine";
        setLists((current) => ({
          ...current,
          [targetScope]: current[targetScope].map((item) =>
            item.id === updated.id ? updated : item
          ),
        }));
      } catch {
        // 计数失败不阻断填词
      }

      onApplyPrompt(prompt.content);
    },
    [onApplyPrompt]
  );

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyNotice("已复制到剪贴板");
    } catch {
      setCopyNotice("复制失败，请手动复制");
    }
  }, []);

  const handleEditClick = useCallback((prompt: SerializedPrompt) => {
    setScope("mine");
    setEditingPromptId(prompt.id);
    setTitle(prompt.title);
    setContent(prompt.content);
    setFormCategory(prompt.category);
    setFormError(null);
    setShowCreateForm(true);
  }, []);

  const handleFavoriteChange = useCallback(
    (prompt: SerializedPrompt) => {
      if (scope === "favorite" && !prompt.isFavorite) {
        setLists((current) => ({
          ...current,
          favorite: current.favorite.filter((item) => item.id !== prompt.id),
        }));
        return;
      }

      setLists((current) => ({
        ...current,
        favorite: current.favorite.map((item) =>
          item.id === prompt.id
            ? { ...item, isFavorite: prompt.isFavorite }
            : item
        ),
      }));
    },
    [scope]
  );

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete || deletingId) {
      return;
    }

    setDeleteError(null);
    setDeletingId(pendingDelete.id);

    try {
      await deleteEditorPrompt(pendingDelete.id);
      setLists((current) => ({
        ...current,
        mine: current.mine.filter((item) => item.id !== pendingDelete.id),
      }));
      setPendingDelete(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeletingId(null);
    }
  }, [deletingId, pendingDelete]);

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-zinc-500">Prompt 库</h2>
          {scope === "mine" ? (
            <button
              className={btnEditorHeaderGhost}
              onClick={() => {
                if (showCreateForm) {
                  resetForm();
                  return;
                }
                resetForm();
                setShowCreateForm(true);
              }}
              type="button"
            >
              <Plus className="h-4 w-4" />
              新增 Prompt
            </button>
          ) : (
            <span aria-hidden className="inline-flex h-9 shrink-0" />
          )}
        </div>

        <PromptFilterTabs
          activeCategory={category}
          activeScope={scope}
          mode="button"
          onCategoryChange={setCategory}
          onScopeChange={(scopeKey) => setScope(scopeKey as EditorPromptScope)}
          scopeOptions={EDITOR_PROMPT_SCOPE_OPTIONS}
        />

        <div className="min-h-5">
          {copyNotice ? (
            <p className="text-xs text-emerald-700" role="status">
              {copyNotice}
            </p>
          ) : null}
        </div>

        {scope === "mine" && showCreateForm ? (
          <div className="rounded-xl border border-zinc-200 bg-[#fdfcf8] p-3">
            <PromptFormFields
              category={formCategory}
              content={content}
              errorMessage={formError}
              isEditing={Boolean(editingPromptId)}
              isSaving={isSaving}
              onCancel={resetForm}
              onCategoryChange={setFormCategory}
              onContentChange={setContent}
              onSave={() => void handleSave()}
              onTitleChange={setTitle}
              title={title}
              variant="inline"
            />
          </div>
        ) : null}

        {loadError ? <p className="text-xs text-red-600">{loadError}</p> : null}

        <div className="min-h-[12rem]">
          {isInitialLoading ? (
            <p className="py-6 text-center text-xs text-zinc-400">加载中…</p>
          ) : visiblePrompts.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-400">
              {emptyMessage}
            </p>
          ) : (
            <div className="space-y-2">
              {visiblePrompts.map((prompt) => (
                <PromptCard
                  compact
                  key={prompt.id}
                  onApply={() => void handleApply(prompt)}
                  onCopy={() => void handleCopy(prompt.content)}
                  onDeleteRequest={
                    scope === "mine"
                      ? () => {
                          setDeleteError(null);
                          setPendingDelete({
                            id: prompt.id,
                            title: prompt.title,
                          });
                        }
                      : undefined
                  }
                  onEdit={() => handleEditClick(prompt)}
                  onFavoriteChange={handleFavoriteChange}
                  prompt={prompt}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {pendingDelete ? (
        <ConfirmDialog
          closeOnOverlayClick={false}
          confirmLabel="确定"
          confirmingLabel="删除中…"
          description={`删除后将无法恢复，Prompt「${pendingDelete.title}」将被永久删除。`}
          errorMessage={deleteError}
          isConfirming={deletingId === pendingDelete.id}
          onCancel={() => {
            if (!deletingId) {
              setPendingDelete(null);
              setDeleteError(null);
            }
          }}
          onConfirm={() => void confirmDelete()}
          title="确定删除该 Prompt 吗？"
        />
      ) : null}
    </>
  );
}
