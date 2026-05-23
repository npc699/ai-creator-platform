"use client";

import { useCallback, useEffect, useRef } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_INTERVAL_MS = 30_000;

type DraftPayload = {
  id: string;
  updatedAt: string;
};

type UseDraftAutosaveParams = {
  title: string;
  // 用 getter 拉取正文，避免把高频变化的 HTML 提升为 React state 导致整棵编辑器树重渲染。
  getContent: () => string;
  draftId: string | null;
  // 草稿恢复尚未完成前严禁触发保存，避免覆盖云端真实数据。
  isReady: boolean;
  onCreated: (draft: DraftPayload) => void;
  onStatus: (status: AutosaveStatus, savedAt: Date | null) => void;
};

export type SaveDraftResult =
  | { ok: true; skipped?: boolean }
  | {
      ok: false;
      reason: "not_ready" | "empty" | "saving" | "error";
      message: string;
    };

type RunSaveOptions = {
  /** 手动保存时跳过「内容未变」判断，但仍会拒绝空正文。 */
  skipCleanCheck?: boolean;
};

export type UseDraftAutosaveResult = {
  /** EditorProvider hydrate 完成后用真实落库内容初始化 baseline，避免再次保存。 */
  seedSavedSnapshot: (title: string, content: string) => void;
  /** 立即保存草稿（供顶部按钮、Ctrl+S 调用）。 */
  saveDraft: (options?: RunSaveOptions) => Promise<SaveDraftResult>;
};

function stripHtmlText(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

export function useDraftAutosave({
  title,
  getContent,
  draftId,
  isReady,
  onCreated,
  onStatus,
}: UseDraftAutosaveParams): UseDraftAutosaveResult {
  // 用 ref 镜像最新值，使 setInterval 闭包内能读到最新 props，而无需重建定时器。
  const titleRef = useRef(title);
  const getContentRef = useRef(getContent);
  const draftIdRef = useRef<string | null>(draftId);
  const isReadyRef = useRef(isReady);
  const isSavingRef = useRef(false);
  // baseline = 最近一次成功落库的内容；null 表示尚未保存过。
  const lastSavedTitleRef = useRef<string | null>(null);
  const lastSavedContentRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const onCreatedRef = useRef(onCreated);
  const onStatusRef = useRef(onStatus);

  // 用 effect 同步 ref，避免 React 19 的 react-hooks/refs 规则在 render 阶段写 ref。
  useEffect(() => {
    titleRef.current = title;
    getContentRef.current = getContent;
    draftIdRef.current = draftId;
    isReadyRef.current = isReady;
    onCreatedRef.current = onCreated;
    onStatusRef.current = onStatus;
  });

  const seedSavedSnapshot = useCallback((titleVal: string, contentVal: string) => {
    lastSavedTitleRef.current = titleVal;
    lastSavedContentRef.current = contentVal;
  }, []);

  const runSave = useCallback(
    async (options?: RunSaveOptions): Promise<SaveDraftResult> => {
      if (!isReadyRef.current) {
        return { ok: false, reason: "not_ready", message: "草稿加载中，请稍候" };
      }
      // isSaving 守卫：进行中的请求未结束前，新 tick 直接跳过，避免并发写入。
      if (isSavingRef.current) {
        return { ok: false, reason: "saving", message: "正在保存中…" };
      }

      const nextTitle = titleRef.current;
      const nextContent = getContentRef.current();

      // 草稿正文必须非空，否则不向数据库新建空白记录。
      if (stripHtmlText(nextContent).length === 0) {
        return { ok: false, reason: "empty", message: "请先输入正文再保存" };
      }

      const isClean =
        lastSavedTitleRef.current === nextTitle &&
        lastSavedContentRef.current === nextContent;
      if (isClean && !options?.skipCleanCheck) {
        return { ok: true, skipped: true };
      }

      isSavingRef.current = true;
      onStatusRef.current("saving", null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const currentId = draftIdRef.current;
        const url = currentId ? `/api/drafts/${currentId}` : "/api/drafts";
        const method = currentId ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: nextTitle, content: nextContent }),
          signal: controller.signal,
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error(`保存失败：${response.status}`);
        }

        const json = (await response.json()) as { draft: DraftPayload };
        if (!json.draft?.id) {
          throw new Error("保存响应缺少 draft.id");
        }

        // 新建场景下把云端返回的 id 透传给上层，后续 tick 走 PUT。
        if (!currentId) {
          onCreatedRef.current(json.draft);
        }

        // baseline 记录的是"被本次请求实际发往后端"的快照，期间用户继续输入不会丢 dirty。
        lastSavedTitleRef.current = nextTitle;
        lastSavedContentRef.current = nextContent;

        onStatusRef.current("saved", new Date(json.draft.updatedAt));
        return { ok: true };
      } catch {
        // 主动 abort 不视作失败，避免 unmount/页面切换时把状态写花。
        if (controller.signal.aborted) {
          return { ok: false, reason: "saving", message: "保存已取消" };
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
    const intervalId = window.setInterval(() => {
      void runSave();
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [runSave]);

  useEffect(() => {
    // 标签页隐藏时尝试做一次性 flush，提高在切换/挂起前落库的概率。
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void runSave();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [runSave]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { seedSavedSnapshot, saveDraft };
}
