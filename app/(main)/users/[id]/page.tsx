// 作者主页：本人与访客看到的数据范围不同；?from= 决定返回按钮目标。
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthorProfilePanel } from "@/components/page-content";
import { ContentPanel } from "@/components/content-panel";
import { PostReaderHeader } from "@/components/post";
import { getCreatorStats } from "@/lib/sidebar/creator-stats";
import {
  getPublicAuthorProfile,
  getPublicAuthorStats,
  listCreatorAuthorPosts,
  listPublicAuthorPosts,
} from "@/lib/users/author-profile";
import {
  buildAuthorProfileHref,
  getAuthorProfileBackTarget,
} from "@/lib/users/profile-navigation";

type UserProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

/** 路由 `/users/[id]`；无公开资料时 404，不暴露用户是否存在。 */
export default async function UserProfilePage({
  params,
  searchParams,
}: UserProfilePageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === id;
  const backTarget = getAuthorProfileBackTarget(from);

  // 本人可见草稿/下线文与完整统计；访客仅公开资料与已发布文章。
  const [profile, publicStats, posts, ownerStats] = await Promise.all([
    getPublicAuthorProfile(id),
    getPublicAuthorStats(id),
    isOwner ? listCreatorAuthorPosts(id) : listPublicAuthorPosts(id),
    isOwner ? getCreatorStats(id) : Promise.resolve(null),
  ]);

  const stats = ownerStats
    ? {
        postCount: ownerStats.publishedCount,
        totalViews: ownerStats.totalViews,
        totalLikes: ownerStats.totalLikes,
      }
    : publicStats;

  if (!profile) {
    notFound();
  }

  // 保留 from 以便文章/Feed 链接回到正确来源页。
  const authorProfilePath = buildAuthorProfileHref(id, from);
  return (
    <ContentPanel
      header={
        <PostReaderHeader
          backHref={backTarget.href}
          backLabel={backTarget.label}
        />
      }
    >
      <AuthorProfilePanel
        authorProfilePath={authorProfilePath}
        isOwner={isOwner}
        ownerEditBio={profile.bio ?? ""}
        ownerEditName={isOwner ? (currentUser?.name ?? "") : ""}
        postCountLabel={isOwner ? "已发布" : "文章"}
        posts={posts}
        profile={profile}
        stats={stats}
      />
    </ContentPanel>
  );
}
