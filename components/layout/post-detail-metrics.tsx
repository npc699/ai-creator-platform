"use client";

import { Eye, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { formatFeedMetric } from "@/lib/feed/format-metric";

type PostDetailMetricsProps = {
  postId: string;
  publishedLabel: string;
  viewCount: number;
  likeCount: number;
  /** 已上线文章为 true 时上报阅读并同步展示浏览量。 */
  trackViews: boolean;
};

/** 详情页发布时间、浏览与点赞展示；阅读上报成功后刷新浏览量。 */
export function PostDetailMetrics({
  postId,
  publishedLabel,
  viewCount: initialViewCount,
  likeCount,
  trackViews,
}: PostDetailMetricsProps) {
  const [viewCount, setViewCount] = useState(initialViewCount);
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    setViewCount(initialViewCount);
  }, [initialViewCount]);

  useEffect(() => {
    if (!trackViews || trackedRef.current === postId) {
      return;
    }

    trackedRef.current = postId;

    void (async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/view`, {
          method: "POST",
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          recorded?: boolean;
          viewCount?: number;
        };

        if (typeof data.viewCount === "number") {
          setViewCount(data.viewCount);
        } else if (data.recorded) {
          setViewCount((current) => current + 1);
        }
      } catch {
        // 阅读量上报失败不阻断阅读
      }
    })();
  }, [postId, trackViews]);

  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
      <span>{publishedLabel}</span>
      <span className="inline-flex items-center gap-1">
        <Eye className="h-3.5 w-3.5" />
        {formatFeedMetric(viewCount)} 浏览
      </span>
      <span className="inline-flex items-center gap-1">
        <Heart className="h-3.5 w-3.5" />
        {formatFeedMetric(likeCount)} 赞
      </span>
    </p>
  );
}
