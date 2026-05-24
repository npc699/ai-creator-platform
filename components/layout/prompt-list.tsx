"use client";

import { EditorEntryLink } from "@/components/layout/editor-entry-link";
import { buildPostExcerpt } from "@/lib/posts/excerpt";

export type PromptListItem = {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
};

type PromptListProps = {
  items: PromptListItem[];
};

export function PromptList({ items }: PromptListProps) {
  return (
    <ul className="divide-y divide-zinc-100">
      {items.map((item) => (
        <li key={item.id}>
          <EditorEntryLink
            className="block px-5 py-4 transition hover:bg-zinc-50"
            promptId={item.id}
          >
            <h3 className="text-base font-semibold text-zinc-900">{item.title}</h3>
            <p className="mt-1 truncate text-sm text-zinc-600">
              {buildPostExcerpt(item.content, 80)}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              更新于{" "}
              {item.updatedAt.toLocaleString("zh-CN", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </EditorEntryLink>
        </li>
      ))}
    </ul>
  );
}
