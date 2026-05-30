"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { DraftArticleList } from "@/components/layout/draft-article-list";
import { FeedEmptyState } from "@/components/layout/feed-empty-state";
import { DRAFTS_PAGE_META } from "@/lib/drafts/page-meta";
import type { FeedArticleItem } from "@/lib/feed/types";
import { btnEditorHeaderGhost } from "@/lib/utils/brand";

type DraftsPageContentProps = {
  items: FeedArticleItem[];
  userId?: string;
};

/** 草稿箱主体：顶栏（标题 + 新建）与列表/空状态。 */
export function DraftsPageContent({ items, userId }: DraftsPageContentProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200/80 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">{DRAFTS_PAGE_META.title}</h2>
        <Link className={btnEditorHeaderGhost} href="/editor">
          <Plus className="h-4 w-4" aria-hidden />
          新建草稿
        </Link>
      </div>

      {items.length === 0 ? (
        <FeedEmptyState
          actionHref="/editor"
          actionLabel="去编辑器创作"
          message="还没有草稿，点击右上角新建草稿"
        />
      ) : (
        <DraftArticleList items={items} userId={userId} />
      )}
    </>
  );
}
