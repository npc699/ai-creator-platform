import { notFound } from "next/navigation";

import { ContentPanel } from "@/components/layout/content-panel";
import { FeedPageLayout } from "@/components/layout/feed-page-layout";
import { PostArticleHeader } from "@/components/layout/post-article-header";
import { PostReaderActions } from "@/components/layout/post-reader-actions";
import { PostReaderHeader } from "@/components/layout/post-reader-header";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  formatPostArticleDate,
  getAuthorLabel,
  getPostDisplayScore,
} from "@/lib/posts/feed-item";
import { getPostReaderBackTarget } from "@/lib/posts/reader-navigation";

type PostPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function PostPage({ params, searchParams }: PostPageProps) {
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

  return (
    <FeedPageLayout>
      <ContentPanel
        header={
          <PostReaderHeader
            actions={
              isAuthor ? (
                <PostReaderActions postId={post.id} status={post.status} />
              ) : null
            }
            backHref={backTarget.href}
            backLabel={backTarget.label}
          />
        }
      >
        <article className="mx-auto w-full max-w-3xl px-6 pb-8 pt-10">
          <PostArticleHeader
            authorImage={post.user.image}
            authorName={getAuthorLabel(post.user)}
            likeCount={post.likeCount}
            postId={post.id}
            publishedLabel={publishedLabel}
            score={getPostDisplayScore()}
            tags={post.tags}
            title={post.title}
            trackViews={post.status === "PUBLISHED"}
            viewCount={post.viewCount}
          />

          {/* 复用编辑器 .tiptap-editor 排版，保证发布页与编辑页所见一致 */}
          <div
            className="tiptap-editor tiptap-readonly pt-8"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </ContentPanel>
    </FeedPageLayout>
  );
}
