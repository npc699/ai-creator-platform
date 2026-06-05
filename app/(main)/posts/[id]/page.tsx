// 文章阅读页：作者可预览未发布/审核中内容；访客仅可见已发布文章。
import { notFound } from "next/navigation";
import { ContentPanel } from "@/components/content-panel";
import { PostReaderArticle, PostReaderHeader } from "@/components/post";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  formatPostArticleDate,
  getAuthorLabel,
  getPostDisplayScore,
} from "@/lib/posts/feed-item";
import { getLikedPostIds } from "@/lib/posts/metrics";
import { getPostReaderBackTarget } from "@/lib/posts/reader-navigation";

type PostPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; published?: string }>;
};

type QualityDimension = {
  score: number;
  reason: string;
};

const QUALITY_DIMENSION_META: Record<
  string,
  { label: string; weight: number }
> = {
  titleAppeal: { label: "标题吸引力", weight: 15 },
  completeness: { label: "内容完整度", weight: 25 },
  structure: { label: "逻辑结构", weight: 20 },
  readability: { label: "可读性", weight: 15 },
  originality: { label: "原创性", weight: 15 },
  imageRelevance: { label: "配图相关性", weight: 10 },
};

function getQualityDimensions(result: unknown) {
  if (!result || typeof result !== "object" || !("quality" in result)) {
    return null;
  }

  const quality = (result as { quality?: unknown }).quality;
  if (!quality || typeof quality !== "object" || !("dimensions" in quality)) {
    return null;
  }

  const dimensions = (quality as { dimensions?: unknown }).dimensions;
  if (!dimensions || typeof dimensions !== "object") {
    return null;
  }

  return Object.entries(dimensions as Record<string, QualityDimension>).filter(
    ([key, value]) =>
      key in QUALITY_DIMENSION_META &&
      typeof value?.score === "number" &&
      typeof value?.reason === "string"
  );
}

/** 路由 `/posts/[id]`；?from= 控制返回目标，?published=1 触发发布成功 Toast。 */
export default async function PostPage({
  params,
  searchParams,
}: PostPageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const user = await getCurrentUser();

  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      userId: true,
      viewCount: true,
      likeCount: true,
      tags: true,
      qualityScore: true,
      reviewStatus: true,
      reviewRecords: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { result: true },
      },
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          image: true,
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const isAuthor = user?.id === post.userId;

  // 非作者只能查看已上线文章；作者可预览已下线内容以便继续编辑。
  if (post.status !== "PUBLISHED" && !isAuthor) {
    notFound();
  }

  const publishedLabel = post.publishedAt
    ? formatPostArticleDate(post.publishedAt)
    : `更新于 ${formatPostArticleDate(post.updatedAt)}`;

  const backTarget = getPostReaderBackTarget({ from, isAuthor });
  // PENDING 状态下维度全 0 无意义，不展示折叠区域。
  const qualityDimensions =
    post.reviewStatus !== "PENDING"
      ? getQualityDimensions(post.reviewRecords[0]?.result)
      : null;

  const likedByViewer = user
    ? (await getLikedPostIds(user.id, [post.id])).has(post.id)
    : false;
  // 非作者且已发布才允许点赞；作者不能给自己的文章点赞。
  const canLike = Boolean(user) && !isAuthor && post.status === "PUBLISHED";
  return (
    <ContentPanel
      header={
        <PostReaderHeader
          backHref={backTarget.href}
          backLabel={backTarget.label}
          isAuthor={isAuthor}
          postId={post.id}
          status={post.status}
        />
      }
    >
      <article className="mx-auto w-full max-w-3xl px-6 pb-8 pt-10">
        <PostReaderArticle
          authorId={post.userId}
          authorImage={post.user.image}
          authorName={getAuthorLabel(post.user)}
          authorReturnPath={from ?? `/posts/${post.id}`}
          canLike={canLike}
          initialLiked={likedByViewer}
          likeCount={post.likeCount}
          postId={post.id}
          publishedLabel={publishedLabel}
          reviewPending={isAuthor && post.reviewStatus === "PENDING"}
          score={getPostDisplayScore(post.qualityScore)}
          showReviewBanner={isAuthor && post.reviewStatus === "PENDING"}
          tags={post.tags}
          title={post.title}
          trackViews={post.status === "PUBLISHED"}
          viewCount={post.viewCount}
        />

        {qualityDimensions?.length ? (
          <details className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium text-zinc-700">
              查看质量评分细项
            </summary>
            <div className="mt-3 space-y-2">
              {qualityDimensions.map(([key, value]) => {
                const meta = QUALITY_DIMENSION_META[key];
                return (
                  <div
                    className="flex flex-col gap-1 rounded-xl bg-zinc-50 px-3 py-2 text-zinc-600"
                    key={key}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-zinc-800">
                        {meta?.label ?? key}
                        <span className="ml-1.5 text-xs font-normal text-zinc-400">
                          占比 {meta?.weight ?? 0}%
                        </span>
                      </span>
                      <span>{value.score}/10</span>
                    </div>
                    <p className="text-xs leading-5 text-zinc-500">
                      {value.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </details>
        ) : null}

        {/* 复用编辑器 .tiptap-editor 排版，保证发布页与编辑页所见一致 */}
        <div
          className="tiptap-editor tiptap-readonly pt-8"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </ContentPanel>
  );
}
