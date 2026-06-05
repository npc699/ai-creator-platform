"use client";

import { useEffect } from "react";

type FeedScrollRestoreProps = {
  storageKey: string;
};

export type FeedScrollPayload = {
  scrollY: number;
  loadedCount?: number;
};

/** 从详情返回 Feed 列表时恢复滚动位置（已发布等全量列表页）。 */
export function FeedScrollRestore({ storageKey }: FeedScrollRestoreProps) {
  useEffect(() => {
    const payload = readFeedScrollPayload(storageKey);
    if (!payload) {
      return;
    }

    clearFeedScrollPayload(storageKey);

    requestAnimationFrame(() => {
      window.scrollTo(0, payload.scrollY);
    });
  }, [storageKey]);

  return null;
}

export function readFeedScrollPayload(storageKey: string): FeedScrollPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as FeedScrollPayload;
    if (typeof parsed.scrollY === "number" && !Number.isNaN(parsed.scrollY)) {
      return parsed;
    }
  } catch {
    const scrollY = Number(raw);
    if (!Number.isNaN(scrollY)) {
      return { scrollY };
    }
  }

  return null;
}

export function clearFeedScrollPayload(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(storageKey);
}

/** 跳转详情前保存滚动位置；首页分页列表可附带已加载条数。 */
export function saveFeedScrollPosition(
  storageKey: string,
  loadedCount?: number
) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: FeedScrollPayload = {
    scrollY: window.scrollY,
    ...(loadedCount != null ? { loadedCount } : {}),
  };

  sessionStorage.setItem(storageKey, JSON.stringify(payload));
}
