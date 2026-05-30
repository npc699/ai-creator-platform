import Link from "next/link";

import { ArticleMetaBadges } from "@/components/layout/article-meta-badges";
import { AuthorAvatar } from "@/components/layout/author-avatar";
import { PostDetailMetrics } from "@/components/layout/post-detail-metrics";
import { buildAuthorProfileHref } from "@/lib/users/profile-navigation";

type PostArticleHeaderProps = {
  title: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  authorReturnPath?: string | null;
  publishedLabel: string;
  postId: string;
  trackViews: boolean;
  viewCount: number;
  likeCount: number;
  score: number | null;
  tags: string[];
  reviewPending?: boolean;
  canLike?: boolean;
  initialLiked?: boolean;
};

/** 文章详情页标题与元信息区，底部分割线与正文衔接。 */
export function PostArticleHeader({
  title,
  authorId,
  authorName,
  authorImage,
  authorReturnPath,
  publishedLabel,
  postId,
  trackViews,
  viewCount,
  likeCount,
  score,
  tags,
  reviewPending,
  canLike = false,
  initialLiked = false,
}: PostArticleHeaderProps) {
  const profileHref = authorId
    ? buildAuthorProfileHref(authorId, authorReturnPath)
    : null;

  return (
    <header className="mb-0">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h1>

      <div className="mt-5 flex items-center gap-3">
        {profileHref ? (
          <Link className="shrink-0" href={profileHref}>
            <AuthorAvatar authorImage={authorImage} authorName={authorName} />
          </Link>
        ) : (
          <AuthorAvatar authorImage={authorImage} authorName={authorName} />
        )}

        <div className="min-w-0">
          {profileHref ? (
            <Link className="group inline-flex" href={profileHref}>
              <span className="text-sm font-medium text-zinc-900 transition group-hover:underline">
                {authorName}
              </span>
            </Link>
          ) : (
            <p className="text-sm font-medium text-zinc-900">{authorName}</p>
          )}

          <PostDetailMetrics
            canLike={canLike}
            initialLiked={initialLiked}
            likeCount={likeCount}
            postId={postId}
            publishedLabel={publishedLabel}
            trackViews={trackViews}
            viewCount={viewCount}
          />
        </div>
      </div>

      <ArticleMetaBadges className="mt-4" reviewPending={reviewPending} score={score} tags={tags} />

      <div aria-hidden className="mt-6 border-t border-zinc-200" />
    </header>
  );
}
