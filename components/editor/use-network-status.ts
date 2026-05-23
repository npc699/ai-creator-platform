"use client";

import { useSyncExternalStore } from "react";

function subscribeOnlineStatus(onStoreChange: () => void) {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

/** SSR 首屏假定在线，与客户端 hydration 保持一致。 */
function getOnlineServerSnapshot() {
  return true;
}

/** 监听浏览器 online/offline，供草稿同步与顶栏离线提示使用。 */
export function useNetworkStatus() {
  return useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );
}
