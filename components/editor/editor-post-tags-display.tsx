"use client";

import { useEditorContext } from "@/components/editor/editor-context";
import { badgeArticleTag } from "@/lib/utils/brand";

/** 标题下方只读展示已添加的文章标签。 */
export function EditorPostTagsDisplay() {
  const { tags } = useEditorContext();

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span className={badgeArticleTag} key={tag}>
          {tag}
        </span>
      ))}
    </div>
  );
}
