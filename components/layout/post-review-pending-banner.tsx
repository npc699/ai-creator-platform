"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils";

type PostReviewPendingBannerProps = {
  postId: string;
};

export function PostReviewPendingBanner({ postId }: PostReviewPendingBannerProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleRetry() {
    if (isRetrying) {
      return;
    }

    setMessage(null);
    setIsError(false);
    setIsRetrying(true);

    try {
      const response = await fetch("/api/review/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
        credentials: "same-origin",
      });

      const payload = (await response.json().catch(() => null)) as {
        retryStatus?: "completed" | "still_pending";
        error?: string;
      } | null;

      if (!response.ok) {
        setMessage(payload?.error ?? "重新审核失败，请稍后重试");
        setIsError(true);
        return;
      }

      if (payload?.retryStatus === "still_pending") {
        setMessage("AI 服务仍不可用，请稍后再试");
        setIsError(true);
        return;
      }

      setMessage("审核完成，正在刷新页面…");
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试");
      setIsError(true);
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-900">
            内容审核未完成，暂无质量评分
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-700">
            缺少质量分的文章在推荐中权重较低，建议重新审核以获取评分。
          </p>
          {message ? (
            <p
              className={cn(
                "mt-2 text-xs leading-5",
                isError ? "text-red-600" : "text-emerald-600"
              )}
            >
              {message}
            </p>
          ) : null}
          <button
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-sm font-medium text-amber-800 transition",
              "hover:bg-amber-100",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
            disabled={isRetrying}
            onClick={() => void handleRetry()}
            type="button"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRetrying && "animate-spin")} />
            {isRetrying ? "审核中…" : "重新审核"}
          </button>
        </div>
      </div>
    </div>
  );
}
