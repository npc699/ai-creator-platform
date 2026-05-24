import { notFound } from "next/navigation";

import { ContentPanel } from "@/components/layout/content-panel";
import { FeedPageLayout } from "@/components/layout/feed-page-layout";
import { PostReaderActions } from "@/components/layout/post-reader-actions";
import { PostReaderHeader } from "@/components/layout/post-reader-header";
import { PostViewTracker } from "@/components/layout/post-view-tracker";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type PostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
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
    ? post.publishedAt.toLocaleString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <FeedPageLayout>
      {post.status === "PUBLISHED" ? <PostViewTracker postId={post.id} /> : null}
      <ContentPanel
        header={
          <PostReaderHeader
            actions={
              isAuthor ? (
                <PostReaderActions postId={post.id} status={post.status} />
              ) : null
            }
          />
        }
      >
        <article className="mx-auto w-full max-w-3xl px-6 pb-8 pt-10">
          <header className="mb-8 border-b border-zinc-200 pb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
              {post.title}
            </h1>
            {publishedLabel ? (
              <p className="mt-3 text-sm text-zinc-500">
                发布于 {publishedLabel}
              </p>
            ) : null}
          </header>

          {/* 复用编辑器 .tiptap-editor 排版，保证发布页与编辑页所见一致 */}
          <div
            className="tiptap-editor tiptap-readonly"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </ContentPanel>
    </FeedPageLayout>
  );
}
