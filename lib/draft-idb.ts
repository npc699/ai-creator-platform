"use client";

import { openDB, type IDBPDatabase } from "idb";

import type { LocalDraftRecord } from "@/lib/draft-sync";

const DB_NAME = "ai-creator-drafts";
const DB_VERSION = 1;
const STORE_NAME = "drafts";

type DraftDb = IDBPDatabase<{
  drafts: {
    key: string;
    value: LocalDraftRecord;
  };
}>;

let dbPromise: Promise<DraftDb> | null = null;

function getDraftDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("当前环境不支持 IndexedDB"));
  }

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "userId" });
        }
      },
    });
  }

  return dbPromise;
}

/** 读取当前用户在浏览器内的本地草稿；不存在时返回 null。 */
export async function getLocalDraft(userId: string) {
  try {
    const db = await getDraftDb();
    return (await db.get(STORE_NAME, userId)) ?? null;
  } catch {
    return null;
  }
}

/** 写入或覆盖本地草稿。多标签页采用 last-write-wins。 */
export async function putLocalDraft(record: LocalDraftRecord) {
  const db = await getDraftDb();
  await db.put(STORE_NAME, record);
}

/** 清除本地草稿（云端已同步且无需保留 pending 时可选调用）。 */
export async function clearLocalDraft(userId: string) {
  try {
    const db = await getDraftDb();
    await db.delete(STORE_NAME, userId);
  } catch {
    // 清理失败不影响主流程。
  }
}
