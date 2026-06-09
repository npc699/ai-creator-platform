import { cn } from "@/lib/utils";

type ListItemSkeletonProps = {
  variant?: "default" | "hot" | "viral";
  withCover?: boolean;
  withAvatar?: boolean;
};

/** 文章列表行骨架，对齐 ArticleListItem 单元格布局。 */
export function ListItemSkeleton({
  variant = "default",
  withCover = false,
  withAvatar = true,
}: ListItemSkeletonProps) {
  return (
    <div aria-hidden className="animate-pulse border-b border-zinc-200 py-4">
      <div className="flex items-start gap-3">
        {variant === "hot" ? (
          <div className="h-7 w-7 shrink-0 rounded-md bg-zinc-100" />
        ) : null}
        {variant === "viral" ? (
          <div className="h-[72px] w-12 shrink-0 rounded-lg bg-emerald-50" />
        ) : null}

        <div className="min-w-0 flex-1 space-y-2">
          {variant === "default" ? (
            <div className="flex items-center gap-2">
              {withAvatar ? (
                <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-100" />
              ) : null}
              <div className="space-y-2">
                <div className="h-3 w-24 rounded bg-zinc-100" />
                <div className="h-2 w-32 rounded bg-zinc-100" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-4 w-32 rounded bg-zinc-100" />
              <div className="ml-auto h-5 w-20 rounded-md bg-zinc-100" />
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-5 w-4/5 rounded bg-zinc-100" />
              <div className="h-4 w-full rounded bg-zinc-100" />
              <div
                className={cn(
                  "h-4 rounded bg-zinc-100",
                  withCover ? "w-4/5" : "w-3/4"
                )}
              />
            </div>
            {withCover ? (
              <div className="h-[72px] w-[96px] shrink-0 rounded-xl bg-zinc-100" />
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <div className="h-5 w-12 rounded-full bg-zinc-100" />
              <div className="h-5 w-10 rounded-full bg-zinc-100" />
            </div>
            <div className="flex shrink-0 gap-3">
              <div className="h-4 w-12 rounded bg-zinc-100" />
              <div className="h-4 w-10 rounded bg-zinc-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** @deprecated 使用 ListItemSkeleton */
export const FeedListItemSkeleton = ListItemSkeleton;
