import { StartCreateLink } from "@/components/layout/navigation/start-create-link";

type CreatorStatsPanelProps = {
  publishedCount: number;
  draftCount: number;
  totalViews: string;
};

export function CreatorStatsPanel({
  publishedCount,
  draftCount,
  totalViews,
}: CreatorStatsPanelProps) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <StartCreateLink />

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-zinc-100 px-2 py-3">
          <p className="text-lg font-semibold text-zinc-900">{publishedCount}</p>
          <p className="mt-1 text-xs text-zinc-900">已发布</p>
        </div>
        <div className="rounded-xl bg-zinc-100 px-2 py-3">
          <p className="text-lg font-semibold text-zinc-900">{draftCount}</p>
          <p className="mt-1 text-xs text-zinc-900">草稿</p>
        </div>
        <div className="rounded-xl bg-zinc-100 px-2 py-3">
          <p className="text-lg font-semibold text-zinc-900">{totalViews}</p>
          <p className="mt-1 text-xs text-zinc-900">总阅读</p>
        </div>
      </div>
    </section>
  );
}
