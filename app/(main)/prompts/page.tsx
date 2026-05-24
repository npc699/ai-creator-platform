import { Suspense } from "react";

import { ContentPanel } from "@/components/layout/content-panel";
import { FeedPageLayout } from "@/components/layout/feed-page-layout";
import { PanelTabNavFallback } from "@/components/layout/panel-tab-nav";
import { PromptsPageContent } from "@/components/layout/prompts-page-content";
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
        take: 100,
      })
    : [];

  const items = serializePromptList(prompts);

  return (
    <FeedPageLayout>
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
    </FeedPageLayout>
  );
}
