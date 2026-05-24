"use client";

import { useEffect, useRef } from "react";

type PostViewTrackerProps = {
  postId: string;
};

/** 文章详情页挂载时上报一次有效阅读（服务端去重）。 */
export function PostViewTracker({ postId }: PostViewTrackerProps) {
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (trackedRef.current === postId) {
      return;
    }

    trackedRef.current = postId;

    void fetch(`/api/posts/${postId}/view`, {
      method: "POST",
      credentials: "same-origin",
    });
  }, [postId]);

  return null;
}
