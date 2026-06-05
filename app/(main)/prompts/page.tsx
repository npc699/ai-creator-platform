// 提示词库：scope / category / sort 由 URL 驱动，首屏 SSR 列表 + 客户端 Tab 切换。
import { Suspense } from "react";
import { ContentPanel } from "@/components/content-panel";
import { PanelTabNavFallback } from "@/components/content-panel";
import { PromptsPageContent } from "@/components/page-content";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parsePromptCategory,
  parsePromptScope,
  parsePromptSort,
} from "@/lib/feed/panel-params";
import { buildPromptListWhere, promptListInclude } from "@/lib/prompts/list";
import { buildPromptListOrderBy } from "@/lib/prompts/query";
import { serializePromptList } from "@/lib/prompts/serialize";

type PromptsPageProps = {
  searchParams: Promise<{
    scope?: string;
    category?: string;
    sort?: string;
  }>;
};

/** 路由 `/prompts`；Suspense 包裹带 searchParams 的 Tab 导航，避免阻塞整页。 */
export default async function PromptsPage({ searchParams }: PromptsPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const scope = parsePromptScope(params.scope ?? null);
  const category = parsePromptCategory(params.category ?? null);
  const sort = parsePromptSort(params.sort ?? null);

  const prompts = user
    ? await prisma.prompt.findMany({
        where: buildPromptListWhere(user.id, scope, category),
        include: promptListInclude(user.id),
        orderBy: buildPromptListOrderBy(sort),
        // 首屏上限，更多由客户端筛选/分页扩展（若后续需要）。
        take: 100,
      })
    : [];

  const items = serializePromptList(prompts);

  return (
    <ContentPanel>
      <Suspense fallback={<PanelTabNavFallback />}>
        <PromptsPageContent
          category={category}
          initialPrompts={items}
          scope={scope}
          sort={sort}
        />
      </Suspense>
    </ContentPanel>
  );
}
