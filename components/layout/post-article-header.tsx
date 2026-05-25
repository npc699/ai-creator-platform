import { ArticleMetaBadges } from "@/components/layout/article-meta-badges";
import { PostDetailMetrics } from "@/components/layout/post-detail-metrics";
import { cn } from "@/lib/utils";

type PostArticleHeaderProps = {
  title: string;
  authorName: string;
  authorImage: string | null;
  publishedLabel: string;
  postId: string;
  trackViews: boolean;
  viewCount: number;
  likeCount: number;
  score: number | null;
  tags: string[];
  reviewPending?: boolean;
};

function AuthorAvatar({
  authorName,
  authorImage,
}: {
  authorName: string;
  authorImage: string | null;
}) {
  const initial = authorName.slice(0, 1) || "?";

  if (authorImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 作者头像可能为任意外部 OAuth URL
      <img
        alt={authorName}
        className="h-10 w-10 rounded-full object-cover"
        height={40}
        src={authorImage}
        width={40}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600"
      )}
    >
      {initial}
    </span>
  );
}

/** 文章详情页标题与元信息区，底部分割线与正文衔接。 */
export function PostArticleHeader({
  title,
  authorName,
  authorImage,
  publishedLabel,
  postId,
  trackViews,
  viewCount,
  likeCount,
  score,
  tags,
  reviewPending,
}: PostArticleHeaderProps) {
  return (
    <header className="mb-0">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h1>

      <div className="mt-5 flex items-center gap-3">
        <AuthorAvatar authorImage={authorImage} authorName={authorName} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-900">{authorName}</p>
          <PostDetailMetrics
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
