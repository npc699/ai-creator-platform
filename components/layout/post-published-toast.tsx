"use client";

import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const TOAST_MESSAGES: Record<string, { text: string; tone: "success" | "warning" }> = {
  success: { text: "内容审核通过，发布成功", tone: "success" },
  pending: { text: "发布成功，内容已进入待审核状态", tone: "warning" },
  reviewed: { text: "内容已保存，重新审核通过", tone: "success" },
};

const TOAST_DURATION_MS = 6000;

export function PostPublishedToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const publishedParam = searchParams.get("published");
  const entry = publishedParam ? TOAST_MESSAGES[publishedParam] : null;
  const [visible, setVisible] = useState(Boolean(entry));

  const dismiss = useCallback(() => {
    setVisible(false);
    // 清除 URL 参数，避免刷新时重复显示
    const url = new URL(window.location.href);
    url.searchParams.delete("published");
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!entry) {
      return;
    }
    setVisible(true);
    const timer = window.setTimeout(dismiss, TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [dismiss, entry]);

  if (!visible || !entry) {
    return null;
  }

  const isWarning = entry.tone === "warning";

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 pointer-events-none">
      <div
        aria-live="polite"
        className={cn(
          "pointer-events-auto flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-medium shadow-lg",
          isWarning
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        )}
      >
        <span>{entry.text}</span>
        <button
          aria-label="关闭提示"
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition",
            isWarning
              ? "text-amber-600 hover:bg-amber-100"
              : "text-emerald-600 hover:bg-emerald-100"
          )}
          onClick={dismiss}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
