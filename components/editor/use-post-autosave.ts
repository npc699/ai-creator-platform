"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  isAuthOrClientError,
  isNetworkError,
} from "@/lib/draft-sync";
import type { AutosaveStatus, SaveDraftResult } from "@/components/editor/use-draft-autosave";

const AUTOSAVE_INTERVAL_MS = 30_000;

type PostPayload = {
  id: string;
  updatedAt: string;
};

type UsePostAutosaveParams = {
  postId: string;
  title: string;
  tags: string[];
  getContent: () => string;
  isOnline: boolean;
  isReady: boolean;
  enabled: boolean;
  onStatus: (status: AutosaveStatus, savedAt: Date | null) => void;
};

type RunSaveOptions = {
  skipCleanCheck?: boolean;
};

export type UsePostAutosaveResult = {
  seedSavedSnapshot: (title: string, content: string, tags: string[]) => void;
  saveDraft: (options?: RunSaveOptions) => Promise<SaveDraftResult>;
};

function stripHtmlText(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function usePostAutosave({
  postId,
  title,
  tags,
  getContent,
  isOnline,
  isReady,
  enabled,
  onStatus,
}: UsePostAutosaveParams): UsePostAutosaveResult {
  const postIdRef = useRef(postId);
  const titleRef = useRef(title);
  const tagsRef = useRef(tags);
  const getContentRef = useRef(getContent);
  const isOnlineRef = useRef(isOnline);
  const isReadyRef = useRef(isReady);
  const enabledRef = useRef(enabled);
  const isSavingRef = useRef(false);
  const lastSavedTitleRef = useRef<string | null>(null);
  const lastSavedContentRef = useRef<string | null>(null);
  const lastSavedTagsRef = useRef<string[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onStatusRef = useRef(onStatus);

  useEffect(() => {
    postIdRef.current = postId;
    titleRef.current = title;
    tagsRef.current = tags;
    getContentRef.current = getContent;
    isOnlineRef.current = isOnline;
    isReadyRef.current = isReady;
    enabledRef.current = enabled;
    onStatusRef.current = onStatus;
  });

  const seedSavedSnapshot = useCallback(
    (titleVal: string, contentVal: string, tagsVal: string[]) => {
      lastSavedTitleRef.current = titleVal;
      lastSavedContentRef.current = contentVal;
      lastSavedTagsRef.current = [...tagsVal];
    },
    []
  );

  const runSave = useCallback(
    async (options?: RunSaveOptions): Promise<SaveDraftResult> => {
      if (!enabledRef.current) {
        return { ok: false, reason: "not_ready", message: "当前不在文章编辑模式" };
      }

      if (!isReadyRef.current) {
        return { ok: false, reason: "not_ready", message: "文章加载中，请稍候" };
      }

      if (isSavingRef.current) {
        return { ok: false, reason: "saving", message: "正在保存中…" };
      }

      const nextTitle = titleRef.current;
      const nextContent = getContentRef.current();

      if (stripHtmlText(nextContent).length === 0) {
        return { ok: false, reason: "empty", message: "请先输入正文再保存" };
      }

      if (!nextTitle.trim()) {
        return { ok: false, reason: "empty", message: "请先输入标题再保存" };
      }

      const nextTags = tagsRef.current;
      const isClean =
        lastSavedTitleRef.current === nextTitle &&
        lastSavedContentRef.current === nextContent &&
        JSON.stringify(lastSavedTagsRef.current) === JSON.stringify(nextTags);
      if (isClean && !options?.skipCleanCheck) {
        return { ok: true, skipped: true };
      }

      if (!isOnlineRef.current || !navigator.onLine) {
        onStatusRef.current("offline", null);
        return {
          ok: false,
          reason: "offline",
          message: "离线中，请联网后再保存文章",
        };
      }

      isSavingRef.current = true;
      onStatusRef.current("saving", null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`/api/posts/${postIdRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: nextTitle,
            content: nextContent,
            tags: nextTags,
          }),
          signal: controller.signal,
          credentials: "same-origin",
        });

        if (!response.ok) {
          const error = new Error(`保存失败：${response.status}`);
          if (isAuthOrClientError(response.status)) {
            (error as Error & { status?: number }).status = response.status;
          }
          throw error;
        }

        const json = (await response.json()) as { post: PostPayload };
        if (!json.post?.id) {
          throw new Error("保存响应缺少 post.id");
        }

        lastSavedTitleRef.current = nextTitle;
        lastSavedContentRef.current = nextContent;
        lastSavedTagsRef.current = [...nextTags];
        onStatusRef.current("saved", new Date(json.post.updatedAt));
        return { ok: true };
      } catch (error) {
        if (controller.signal.aborted) {
          return { ok: false, reason: "saving", message: "保存已取消" };
        }

        const status = (error as Error & { status?: number }).status;
        if (status && isAuthOrClientError(status)) {
          onStatusRef.current("error", null);
          return { ok: false, reason: "error", message: "保存失败，请稍后重试" };
        }

        if (isNetworkError(error)) {
          onStatusRef.current("offline", null);
          return {
            ok: false,
            reason: "offline",
            message: "离线中，请联网后再保存文章",
          };
        }

        onStatusRef.current("error", null);
        return { ok: false, reason: "error", message: "保存失败，请稍后重试" };
      } finally {
        isSavingRef.current = false;
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    []
  );

  const saveDraft = useCallback(
    (options?: RunSaveOptions) => runSave(options),
    [runSave]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void runSave();
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, runSave]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void runSave();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, runSave]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { seedSavedSnapshot, saveDraft };
}
