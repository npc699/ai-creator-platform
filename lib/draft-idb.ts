"use client";

import { openDB, type IDBPDatabase } from "idb";

import {
  getDraftStorageKey,
  type LocalDraftRecord,
} from "@/lib/draft-sync";

const DB_NAME = "ai-creator-drafts";
const DB_VERSION = 2;
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
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(STORE_NAME, { keyPath: "userId" });
        }
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains(STORE_NAME)) {
            db.deleteObjectStore(STORE_NAME);
          }
          db.createObjectStore(STORE_NAME, { keyPath: "storageKey" });
        }
      },
    });
  }

  return dbPromise;
}

export { getDraftStorageKey };

export async function getLocalDraft(storageKey: string) {
  try {
    const db = await getDraftDb();
    return (await db.get(STORE_NAME, storageKey)) ?? null;
  } catch {
    return null;
  }
}

export async function putLocalDraft(record: LocalDraftRecord) {
  const db = await getDraftDb();
  await db.put(STORE_NAME, record);
}

export async function clearLocalDraft(storageKey: string) {
  try {
    const db = await getDraftDb();
    await db.delete(STORE_NAME, storageKey);
  } catch {
    // 清理失败不影响主流程。
  }
}

/** 发布后清理该用户的新建稿本地缓存。 */
export async function clearNewDraftLocal(userId: string) {
  await clearLocalDraft(getDraftStorageKey(userId, null));
}
