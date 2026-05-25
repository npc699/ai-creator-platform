"use client";

import { useCallback, useEffect, useRef } from "react";

import { getLocalDraft, putLocalDraft } from "@/lib/draft-idb";
import {
  isAuthOrClientError,
  isNetworkError,
  shouldUploadLocal,
  type CloudDraftSnapshot,
  type LocalDraftRecord,
} from "@/lib/draft-sync";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

const AUTOSAVE_INTERVAL_MS = 30_000;
const LOCAL_DEBOUNCE_MS = 2_500;

type DraftPayload = {
  id: string;
  updatedAt: string;
};

type UseDraftAutosaveParams = {
  userId: string;
  title: string;
  tags: string[];
  // 用 getter 拉取正文，避免把高频变化的 HTML 提升为 React state 导致整棵编辑器树重渲染。
  getContent: () => string;
  draftId: string | null;
  isOnline: boolean;
  // 草稿恢复尚未完成前严禁触发保存，避免覆盖云端真实数据。
  isReady: boolean;
  /** 文章编辑模式下关闭草稿自动保存，避免双写。 */
  enabled?: boolean;
  onCreated: (draft: DraftPayload) => void;
  onStatus: (status: AutosaveStatus, savedAt: Date | null) => void;
};

export type SaveDraftResult =
  | { ok: true; skipped?: boolean; draftId?: string | null }
  | {
      ok: false;
      reason: "not_ready" | "empty" | "saving" | "error" | "offline";
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
  /** 联网后对比时间戳并上传 pending 本地草稿。 */
  syncPendingDraft: () => Promise<void>;
  /** 编辑时 debounce 触发本地写入。 */
  scheduleLocalPersist: () => void;
  /** 相对上次成功落库是否有未保存修改。 */
  isDirty: () => boolean;
};

function stripHtmlText(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

async function fetchCloudDraft(
  draftId: string | null,
  signal?: AbortSignal
): Promise<CloudDraftSnapshot | null> {
  const url = draftId ? `/api/drafts/${draftId}` : "/api/drafts/latest";
  const response = await fetch(url, {
    signal,
    credentials: "same-origin",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 404) {
      return null;
    }
    throw new Error(`拉取草稿失败：${response.status}`);
  }

  const data = (await response.json()) as {
    draft: CloudDraftSnapshot | null;
  };
  return data.draft;
}

export function useDraftAutosave({
  userId,
  title,
  tags,
  getContent,
  draftId,
  isOnline,
  isReady,
  enabled = true,
  onCreated,
  onStatus,
}: UseDraftAutosaveParams): UseDraftAutosaveResult {
  const userIdRef = useRef(userId);
  const titleRef = useRef(title);
  const tagsRef = useRef(tags);
  const getContentRef = useRef(getContent);
  const draftIdRef = useRef<string | null>(draftId);
  const isOnlineRef = useRef(isOnline);
  const isReadyRef = useRef(isReady);
  const enabledRef = useRef(enabled);
  const isSavingRef = useRef(false);
  const isSyncingRef = useRef(false);
  // baseline = 最近一次成功落库的内容；null 表示尚未保存过。
  const lastSavedTitleRef = useRef<string | null>(null);
  const lastSavedContentRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const localDebounceRef = useRef<number | null>(null);
  const onCreatedRef = useRef(onCreated);
  const onStatusRef = useRef(onStatus);

  useEffect(() => {
    userIdRef.current = userId;
    titleRef.current = title;
    tagsRef.current = tags;
    getContentRef.current = getContent;
    draftIdRef.current = draftId;
    isOnlineRef.current = isOnline;
    isReadyRef.current = isReady;
    enabledRef.current = enabled;
    onCreatedRef.current = onCreated;
    onStatusRef.current = onStatus;
  });

  const seedSavedSnapshot = useCallback((titleVal: string, contentVal: string) => {
    lastSavedTitleRef.current = titleVal;
    lastSavedContentRef.current = contentVal;
  }, []);

  const persistLocalDraft = useCallback(
    async (options?: {
      pendingSync?: boolean;
      cloudUpdatedAt?: string | null;
      draftIdOverride?: string | null;
    }) => {
      const nextTitle = titleRef.current;
      const nextContent = getContentRef.current();

      if (stripHtmlText(nextContent).length === 0) {
        return;
      }

      const now = new Date().toISOString();
      let cloudUpdatedAt: string | null = null;

      if (options?.cloudUpdatedAt !== undefined) {
        cloudUpdatedAt = options.cloudUpdatedAt;
      } else if (options?.pendingSync) {
        const existing = await getLocalDraft(userIdRef.current);
        cloudUpdatedAt = existing?.cloudUpdatedAt ?? null;
      }

      const record: LocalDraftRecord = {
        userId: userIdRef.current,
        draftId: options?.draftIdOverride ?? draftIdRef.current,
        title: nextTitle,
        content: nextContent,
        tags: [...tagsRef.current],
        localUpdatedAt: now,
        cloudUpdatedAt,
        pendingSync: options?.pendingSync ?? true,
      };

      await putLocalDraft(record);
    },
    []
  );

  const scheduleLocalPersist = useCallback(() => {
    if (!isReadyRef.current || !enabledRef.current) {
      return;
    }

    if (localDebounceRef.current !== null) {
      window.clearTimeout(localDebounceRef.current);
    }

    localDebounceRef.current = window.setTimeout(() => {
      localDebounceRef.current = null;
      void persistLocalDraft({ pendingSync: true });
    }, LOCAL_DEBOUNCE_MS);
  }, [persistLocalDraft]);

  const uploadToCloud = useCallback(
    async (
      nextTitle: string,
      nextContent: string,
      signal?: AbortSignal
    ): Promise<DraftPayload> => {
      const currentId = draftIdRef.current;
      const url = currentId ? `/api/drafts/${currentId}` : "/api/drafts";
      const method = currentId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle, content: nextContent }),
        signal,
        credentials: "same-origin",
      });

      if (!response.ok) {
        const error = new Error(`保存失败：${response.status}`);
        if (isAuthOrClientError(response.status)) {
          (error as Error & { status?: number }).status = response.status;
        }
        throw error;
      }

      const json = (await response.json()) as { draft: DraftPayload };
      if (!json.draft?.id) {
        throw new Error("保存响应缺少 draft.id");
      }

      return json.draft;
    },
    []
  );

  const runSave = useCallback(
    async (options?: RunSaveOptions): Promise<SaveDraftResult> => {
      if (!enabledRef.current) {
        return { ok: false, reason: "not_ready", message: "当前不在草稿编辑模式" };
      }

      if (!isReadyRef.current) {
        return { ok: false, reason: "not_ready", message: "草稿加载中，请稍候" };
      }

      if (isSavingRef.current) {
        return { ok: false, reason: "saving", message: "正在保存中…" };
      }

      const nextTitle = titleRef.current;
      const nextContent = getContentRef.current();

      if (stripHtmlText(nextContent).length === 0) {
        return { ok: false, reason: "empty", message: "请先输入正文再保存" };
      }

      const isClean =
        lastSavedTitleRef.current === nextTitle &&
        lastSavedContentRef.current === nextContent;
      if (isClean && !options?.skipCleanCheck) {
        return { ok: true, skipped: true, draftId: draftIdRef.current };
      }

      isSavingRef.current = true;
      onStatusRef.current("saving", null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await persistLocalDraft({ pendingSync: true });

        if (!isOnlineRef.current || !navigator.onLine) {
          onStatusRef.current("offline", null);
          return {
            ok: false,
            reason: "offline",
            message: "离线中，内容已本地保存",
          };
        }

        const saved = await uploadToCloud(
          nextTitle,
          nextContent,
          controller.signal
        );

        if (!draftIdRef.current) {
          onCreatedRef.current(saved);
          draftIdRef.current = saved.id;
        }

        lastSavedTitleRef.current = nextTitle;
        lastSavedContentRef.current = nextContent;

        await persistLocalDraft({
          pendingSync: false,
          cloudUpdatedAt: saved.updatedAt,
          draftIdOverride: saved.id,
        });

        onStatusRef.current("saved", new Date(saved.updatedAt));
        return { ok: true, draftId: draftIdRef.current };
      } catch (error) {
        if (controller.signal.aborted) {
          return { ok: false, reason: "saving", message: "保存已取消" };
        }

        const status = (error as Error & { status?: number }).status;
        if (status && isAuthOrClientError(status)) {
          onStatusRef.current("error", null);
          return {
            ok: false,
            reason: "error",
            message: "保存失败，请稍后重试",
          };
        }

        if (isNetworkError(error)) {
          onStatusRef.current("offline", null);
          return {
            ok: false,
            reason: "offline",
            message: "离线中，内容已本地保存",
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
    [persistLocalDraft, uploadToCloud]
  );

  const syncPendingDraft = useCallback(async () => {
    if (!enabledRef.current) {
      return;
    }

    if (!isReadyRef.current || isSyncingRef.current || isSavingRef.current) {
      return;
    }

    if (!isOnlineRef.current || !navigator.onLine) {
      return;
    }

    isSyncingRef.current = true;

    try {
      const local = await getLocalDraft(userIdRef.current);
      if (!local || !local.pendingSync) {
        return;
      }

      if (stripHtmlText(local.content).length === 0) {
        return;
      }

      let cloud: CloudDraftSnapshot | null = null;
      try {
        cloud = await fetchCloudDraft(local.draftId ?? draftIdRef.current);
      } catch (error) {
        if (isNetworkError(error)) {
          onStatusRef.current("offline", null);
        }
        return;
      }

      if (!shouldUploadLocal(local, cloud)) {
        if (cloud) {
          await persistLocalDraft({
            pendingSync: false,
            cloudUpdatedAt: cloud.updatedAt,
            draftIdOverride: cloud.id,
          });
          draftIdRef.current = cloud.id;
          lastSavedTitleRef.current = cloud.title;
          lastSavedContentRef.current = cloud.content;
          onStatusRef.current("saved", new Date(cloud.updatedAt));
        }
        return;
      }

      onStatusRef.current("saving", null);
      const saved = await uploadToCloud(local.title, local.content);

      if (!draftIdRef.current) {
        onCreatedRef.current(saved);
      }
      draftIdRef.current = saved.id;

      lastSavedTitleRef.current = local.title;
      lastSavedContentRef.current = local.content;

      await persistLocalDraft({
        pendingSync: false,
        cloudUpdatedAt: saved.updatedAt,
        draftIdOverride: saved.id,
      });

      onStatusRef.current("saved", new Date(saved.updatedAt));
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (status && isAuthOrClientError(status)) {
        onStatusRef.current("error", null);
        return;
      }

      if (isNetworkError(error)) {
        onStatusRef.current("offline", null);
      } else {
        onStatusRef.current("error", null);
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [persistLocalDraft, uploadToCloud]);

  const saveDraft = useCallback(
    (options?: RunSaveOptions) => runSave(options),
    [runSave]
  );

  const isDirty = useCallback(() => {
    const nextTitle = titleRef.current;
    const nextContent = getContentRef.current();
    const hasContent = stripHtmlText(nextContent).length > 0;

    if (
      lastSavedTitleRef.current === null &&
      lastSavedContentRef.current === null
    ) {
      return hasContent || nextTitle.trim().length > 0;
    }

    return (
      lastSavedTitleRef.current !== nextTitle ||
      lastSavedContentRef.current !== nextContent
    );
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    scheduleLocalPersist();
  }, [enabled, tags, title, scheduleLocalPersist]);

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
      if (localDebounceRef.current !== null) {
        window.clearTimeout(localDebounceRef.current);
      }
    };
  }, []);

  return { seedSavedSnapshot, saveDraft, syncPendingDraft, scheduleLocalPersist, isDirty };
}
