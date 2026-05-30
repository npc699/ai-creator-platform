import { AuthorAvatar } from "@/components/layout/author-avatar";
import { AuthorProfileEditSection } from "@/components/layout/author-profile-edit-section";
import { AuthorProfilePostItem } from "@/components/layout/author-profile-post-item";
import { formatCreatorStatCount } from "@/lib/sidebar/creator-stats";
import type {
  PublicAuthorPost,
  PublicAuthorProfile,
  PublicAuthorStats,
} from "@/lib/users/author-profile";

type AuthorProfilePanelProps = {
  profile: PublicAuthorProfile;
  stats: PublicAuthorStats;
  posts: PublicAuthorPost[];
  authorProfilePath: string;
  /** 当前登录用户访问自己的主页时可编辑资料 */
  isOwner?: boolean;
  ownerEditName?: string;
  ownerEditBio?: string;
  /** 本人主页与侧栏对齐为「已发布」，访客主页为「文章」。 */
  postCountLabel?: string;
};

function AuthorProfileStatsBar({
  stats,
  postCountLabel = "文章",
}: {
  stats: PublicAuthorStats;
  postCountLabel?: string;
}) {
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

/** 发布者主页主体：资料区、统计与文章列表。 */
export function AuthorProfilePanel({
  profile,
  stats,
  posts,
  authorProfilePath,
  isOwner = false,
  ownerEditName = "",
  ownerEditBio = "",
  postCountLabel = "文章",
}: AuthorProfilePanelProps) {
  return (
    <div className="px-6 pb-8 pt-8">
      <div className="flex items-start gap-4">
        <AuthorAvatar
          authorImage={profile.image}
          authorName={profile.name}
          size="lg"
        />
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold text-zinc-950">{profile.name}</h1>
            {isOwner ? (
              <AuthorProfileEditSection
                initialBio={ownerEditBio}
                initialName={ownerEditName}
              />
            ) : null}
          </div>
          {profile.bio ? (
            <p className="mt-2 text-sm leading-6 text-zinc-600">{profile.bio}</p>
          ) : isOwner && !profile.bio ? (
            <p className="mt-2 text-sm text-zinc-400">暂无简介</p>
          ) : null}
        </div>
      </div>

      <AuthorProfileStatsBar postCountLabel={postCountLabel} stats={stats} />

      <section className="mt-8 overflow-hidden rounded-xl border border-zinc-200">
        <div className="border-b border-zinc-200 bg-amber-50/40 px-5 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">全部文章</h2>
        </div>

        {posts.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">
            暂无已发布文章
          </p>
        ) : (
          <div className="px-5">
            {posts.map((post) => (
              <AuthorProfilePostItem
                authorProfilePath={authorProfilePath}
                coverUrl={post.coverUrl}
                excerpt={post.excerpt}
                key={post.id}
                likes={post.likes}
                postId={post.id}
                publishedAt={post.publishedAt}
                score={post.score}
                tags={post.tags}
                title={post.title}
                updatedAt={post.updatedAt}
                views={post.views}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
