"use client";

import { X } from "lucide-react";

import { useEditorContext } from "@/components/editor/editor-context";
import { badgeArticleTag } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

/** 标题下方展示文章标签，悬停可删除。 */
export function EditorPostTagsDisplay() {
  const { tags, removeTag } = useEditorContext();

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          className={cn(badgeArticleTag, "group/tag inline-flex items-center gap-1")}
          key={tag}
        >
          {tag}
          <button
            aria-label={`移除标签 ${tag}`}
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-zinc-500 opacity-0 transition hover:bg-zinc-200/80 hover:text-zinc-800 group-hover/tag:opacity-100"
            onClick={() => removeTag(tag)}
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
