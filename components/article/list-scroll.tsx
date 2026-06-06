"use client";

import { useEffect } from "react";

import type { ListScrollPayload } from "./types";

type ListScrollRestoreProps = {
  storageKey: string;
};

/** 从详情返回列表时恢复滚动位置（已发布等全量列表页）。 */
export function ListScrollRestore({ storageKey }: ListScrollRestoreProps) {
  useEffect(() => {
    const payload = readListScrollPayload(storageKey);
    if (!payload) {
      return;
    }

    clearListScrollPayload(storageKey);

    requestAnimationFrame(() => {
      window.scrollTo(0, payload.scrollY);
    });
  }, [storageKey]);

  return null;
}

/** @deprecated 使用 ListScrollRestore */
export const FeedScrollRestore = ListScrollRestore;

export function readListScrollPayload(storageKey: string): ListScrollPayload | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ListScrollPayload;
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

/** @deprecated 使用 readListScrollPayload */
export const readFeedScrollPayload = readListScrollPayload;

export function clearListScrollPayload(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(storageKey);
}

/** @deprecated 使用 clearListScrollPayload */
export const clearFeedScrollPayload = clearListScrollPayload;

/** 跳转详情前保存滚动位置；首页分页列表可附带已加载条数。 */
export function saveListScrollPosition(
  storageKey: string,
  loadedCount?: number
) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: ListScrollPayload = {
    scrollY: window.scrollY,
    ...(loadedCount != null ? { loadedCount } : {}),
  };

  sessionStorage.setItem(storageKey, JSON.stringify(payload));
}

/** @deprecated 使用 saveListScrollPosition */
export const saveFeedScrollPosition = saveListScrollPosition;
