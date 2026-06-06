// 作者主页：本人与访客看到的数据范围不同；?from= 决定返回按钮目标。
import { notFound } from "next/navigation";

import { UserProfilePage } from "@/components/pages";
import { ReaderHeader } from "@/components/reader";
import { ContentPanel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import {
  buildAuthorProfileHref,
  getAuthorProfileBackTarget,
  getCreatorStats,
  getPublicAuthorProfile,
  getPublicAuthorStats,
  listCreatorAuthorPosts,
  listPublicAuthorPosts,
} from "@/lib/users";

type UserProfileRouteProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

/** 路由 `/users/[id]`；无公开资料时 404，不暴露用户是否存在。 */
export default async function UserProfileRoute({
  params,
  searchParams,
}: UserProfileRouteProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === id;
  const backTarget = getAuthorProfileBackTarget(from);

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

  const authorProfilePath = buildAuthorProfileHref(id, from);

  return (
    <ContentPanel
      header={
        <ReaderHeader
          backHref={backTarget.href}
          backLabel={backTarget.label}
        />
      }
    >
      <UserProfilePage
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
