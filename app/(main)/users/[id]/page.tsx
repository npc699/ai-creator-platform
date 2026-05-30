import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { AuthorProfilePanel } from "@/components/layout/author-profile-panel";
import { ContentPanel } from "@/components/layout/content-panel";
import { FeedPageLayout } from "@/components/layout/feed-page-layout";
import { PostReaderHeader } from "@/components/layout/post-reader-header";
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

export default async function UserProfilePage({
  params,
  searchParams,
}: UserProfilePageProps) {
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
    <FeedPageLayout>
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
    </FeedPageLayout>
  );
}
