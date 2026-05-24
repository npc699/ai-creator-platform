import { ContentPanel } from "@/components/layout/content-panel";
import { FeedEmptyState } from "@/components/layout/feed-empty-state";
import { FeedPageLayout } from "@/components/layout/feed-page-layout";
import { PromptList } from "@/components/layout/prompt-list";
import { PromptSortNav } from "@/components/layout/prompt-sort-nav";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parsePromptCategory } from "@/lib/feed/panel-params";

type PromptsPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function PromptsPage({ searchParams }: PromptsPageProps) {
  const user = await getCurrentUser();
  const { category: categoryParam } = await searchParams;
  const category = parsePromptCategory(categoryParam ?? null);

  const prompts = user
    ? await prisma.prompt.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          updatedAt: true,
        },
      })
    : [];

  // 分类字段尚未入库，非「全部」Tab 暂展示空态，保留导航结构供后续接入。
  const visiblePrompts = category === "all" ? prompts : [];

  return (
    <FeedPageLayout>
      <ContentPanel header={<PromptSortNav />} suspenseHeader>
        {visiblePrompts.length === 0 ? (
          <FeedEmptyState
            actionHref="/editor"
            actionLabel="去编辑器创作"
            message={
              category === "all"
                ? "还没有 Prompt，可在编辑器中创建"
                : "该分类下暂无 Prompt，分类筛选将在后续版本接入"
            }
          />
        ) : (
          <PromptList items={visiblePrompts} />
        )}
      </ContentPanel>
    </FeedPageLayout>
  );
}
