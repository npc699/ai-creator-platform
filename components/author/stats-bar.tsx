import { formatCreatorStatCount } from "@/lib/users";
import type { PublicAuthorStats } from "@/lib/users/author-profile";

type AuthorProfileStatsBarProps = {
  stats: PublicAuthorStats;
  /** 本人主页与侧栏对齐为「已发布」，访客主页为「文章」。 */
  postCountLabel?: string;
};

/** 发布者主页三栏统计：文章数、总阅读、总点赞。 */
export function AuthorProfileStatsBar({
  stats,
  postCountLabel = "文章",
}: AuthorProfileStatsBarProps) {
  const items = [
    { label: postCountLabel, value: String(stats.postCount) },
    { label: "总阅读", value: formatCreatorStatCount(stats.totalViews) },
    { label: "总点赞", value: formatCreatorStatCount(stats.totalLikes) },
  ];

  return (
    <div className="mt-6 grid grid-cols-3 divide-x divide-zinc-200 rounded-xl border border-zinc-200 bg-zinc-50/50">
      {items.map((item) => (
        <div className="px-4 py-4 text-center" key={item.label}>
          <p className="text-xl font-semibold text-zinc-900">{item.value}</p>
          <p className="mt-1 text-sm text-zinc-500">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
