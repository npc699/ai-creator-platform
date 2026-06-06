"use client";

/** 浏览器侧 REST 客户端与 IndexedDB。仅 Client Component 使用；服务端请走 API route 或 `lib/*` 域模块。 */
export {
  deleteEditorAsset,
  fetchEditorAssets,
  registerAiImageAsset,
  renameEditorAsset,
  uploadLocalImageAsset,
  type EditorAsset,
} from "./assets/api";

export {
  createEditorPrompt,
  deleteEditorPrompt,
  fetchEditorPrompt,
  fetchEditorPrompts,
  toggleEditorPromptFavorite,
  updateEditorPrompt,
  recordEditorPromptUse,
  type EditorPrompt,
} from "./prompts/api";

export {
  clearLocalDraft,
  clearNewDraftLocal,
  getLocalDraft,
  putLocalDraft,
} from "./drafts/idb";
