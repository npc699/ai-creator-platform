import {
  AuthorProfileHeader,
  AuthorProfileStatsBar,
} from "@/components/author";
import type {
  PublicAuthorPost,
  PublicAuthorProfile,
  PublicAuthorStats,
} from "@/lib/users/author-profile";

import { ProfilePostItem } from "./profile-post-item";

type UserProfilePageProps = {
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

/** 发布者主页主体：资料区、统计与文章列表。 */
export function UserProfilePage({
  profile,
  stats,
  posts,
  authorProfilePath,
  isOwner = false,
  ownerEditName = "",
  ownerEditBio = "",
  postCountLabel = "文章",
}: UserProfilePageProps) {
  return (
    <div className="px-6 pb-8 pt-8">
      <AuthorProfileHeader
        bio={profile.bio}
        image={profile.image}
        isOwner={isOwner}
        name={profile.name}
        ownerEditBio={ownerEditBio}
        ownerEditName={ownerEditName}
      />

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
              <ProfilePostItem
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
