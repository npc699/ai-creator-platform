/** 云端草稿快照，用于进入编辑器时的冲突合并。 */
export type CloudDraftSnapshot = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

/** IndexedDB 本地草稿记录。 */
export type LocalDraftRecord = {
  userId: string;
  draftId: string | null;
  title: string;
  content: string;
  /** 最后一次本地写入时间（ISO）。 */
  localUpdatedAt: string;
  /** 最后一次云端成功保存时间；尚未落云时为 null。 */
  cloudUpdatedAt: string | null;
  /** 本地有尚未同步到云端的修改。 */
  pendingSync: boolean;
};

export type DraftLoadSource = "cloud" | "local" | "none";

export type PickDraftOnLoadResult = {
  source: DraftLoadSource;
  draft: {
    id: string | null;
    title: string;
    content: string;
    updatedAt: string | null;
  } | null;
  /** 进入编辑器后是否需要立即尝试把本地 pending 推上云端。 */
  shouldSyncAfterLoad: boolean;
  /** 用云端恢复后需回写 IDB 的记录；null 表示不写。 */
  localRecordToPersist: LocalDraftRecord | null;
};

function hasDraftContent(content: string) {
  return content.replace(/<[^>]*>/g, "").trim().length > 0;
}

function parseTime(iso: string | null | undefined) {
  if (!iso) {
    return 0;
  }
  const value = Date.parse(iso);
  return Number.isFinite(value) ? value : 0;
}

/** 本地是否应覆盖云端：pending 且本地时间戳更新。无云端草稿时视为需上传。 */
export function shouldUploadLocal(
  local: LocalDraftRecord,
  cloud: CloudDraftSnapshot | null
) {
  if (!local.pendingSync) {
    return false;
  }

  if (!cloud) {
    return hasDraftContent(local.content);
  }

  return parseTime(local.localUpdatedAt) > parseTime(cloud.updatedAt);
}

/** 进入编辑器时决定恢复云端还是本地，以及是否后续 sync。 */
export function pickDraftOnLoad(
  userId: string,
  cloud: CloudDraftSnapshot | null,
  local: LocalDraftRecord | null,
  options?: { isOnline?: boolean }
): PickDraftOnLoadResult {
  const isOnline = options?.isOnline ?? true;
  const cloudHasContent = cloud ? hasDraftContent(cloud.content) : false;
  const localHasContent = local ? hasDraftContent(local.content) : false;

  if (!cloudHasContent && !localHasContent) {
    return {
      source: "none",
      draft: null,
      shouldSyncAfterLoad: false,
      localRecordToPersist: null,
    };
  }

  if (!localHasContent && cloud) {
    return {
      source: "cloud",
      draft: {
        id: cloud.id,
        title: cloud.title,
        content: cloud.content,
        updatedAt: cloud.updatedAt,
      },
      shouldSyncAfterLoad: false,
      localRecordToPersist: {
        userId,
        draftId: cloud.id,
        title: cloud.title,
        content: cloud.content,
        localUpdatedAt: cloud.updatedAt,
        cloudUpdatedAt: cloud.updatedAt,
        pendingSync: false,
      },
    };
  }

  if (!cloudHasContent && local) {
    return {
      source: "local",
      draft: {
        id: local.draftId,
        title: local.title,
        content: local.content,
        updatedAt: local.localUpdatedAt,
      },
      shouldSyncAfterLoad: isOnline && local.pendingSync,
      localRecordToPersist: null,
    };
  }

  if (cloud && local) {
    const localIsNewer = shouldUploadLocal(local, cloud);

    if (localIsNewer) {
      return {
        source: "local",
        draft: {
          id: local.draftId ?? cloud.id,
          title: local.title,
          content: local.content,
          updatedAt: local.localUpdatedAt,
        },
        shouldSyncAfterLoad: isOnline,
        localRecordToPersist: null,
      };
    }

    return {
      source: "cloud",
      draft: {
        id: cloud.id,
        title: cloud.title,
        content: cloud.content,
        updatedAt: cloud.updatedAt,
      },
      shouldSyncAfterLoad: false,
      localRecordToPersist: {
        userId: local.userId,
        draftId: cloud.id,
        title: cloud.title,
        content: cloud.content,
        localUpdatedAt: cloud.updatedAt,
        cloudUpdatedAt: cloud.updatedAt,
        pendingSync: false,
      },
    };
  }

  return {
    source: "none",
    draft: null,
    shouldSyncAfterLoad: false,
    localRecordToPersist: null,
  };
}

/** 打开指定草稿时合并 IDB：仅当 local.draftId 与目标稿一致才参与冲突合并。 */
export function pickDraftOnLoadForId(
  userId: string,
  cloud: CloudDraftSnapshot,
  local: LocalDraftRecord | null,
  options?: { isOnline?: boolean }
): PickDraftOnLoadResult {
  const scopedLocal =
    local && local.draftId === cloud.id ? local : null;
  return pickDraftOnLoad(userId, cloud, scopedLocal, options);
}

/** 区分网络失败与业务错误，避免 401 被误标为离线。 */
export function isNetworkError(error: unknown) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return true;
  }

  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("load failed") ||
      message.includes("network request failed")
    );
  }

  return false;
}

/** fetch 响应是否为需单独处理的鉴权/业务错误（非离线）。 */
export function isAuthOrClientError(status: number) {
  return status === 401 || status === 403 || status === 400 || status === 404;
}
