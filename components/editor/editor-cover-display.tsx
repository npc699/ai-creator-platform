"use client";

import { RefreshCw, Trash2 } from "lucide-react";

import { useEditorContext } from "@/components/editor/editor-context";
import { cn } from "@/lib/utils";

/** 标题下方展示已选封面，悬停可重新选择或删除。 */
export function EditorCoverDisplay() {
  const { coverUrl, clearCoverUrl, openCoverDialog } = useEditorContext();

  if (!coverUrl) {
    return null;
  }

  return (
    <div className="group/cover relative mt-4 w-fit max-w-full">
      <div
        className={cn(
          "relative h-[72px] w-[128px] shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50"
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="文章封面"
          className="h-full w-full object-cover"
          src={coverUrl}
        />
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/50 p-2",
            "opacity-0 transition group-hover/cover:opacity-100 group-focus-within/cover:opacity-100"
          )}
        >
          <button
            className="inline-flex w-full max-w-[7.5rem] items-center justify-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium leading-none text-zinc-800 transition hover:bg-zinc-100"
            onClick={openCoverDialog}
            type="button"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            重新选择
          </button>
          <button
            className="inline-flex w-full max-w-[7.5rem] items-center justify-center gap-1 rounded-lg bg-red-500 px-2.5 py-1.5 text-xs font-medium leading-none text-white transition hover:bg-red-600"
            onClick={clearCoverUrl}
            type="button"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
