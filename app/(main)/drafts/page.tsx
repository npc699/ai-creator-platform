// 草稿箱：列出当前用户草稿，点击进入编辑器继续创作。
import { DraftsPage } from "@/components/pages";
import { ContentPanel } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildDraftListWhere } from "@/lib/drafts/query";
import { mapDraftToFeedItem } from "@/lib/drafts/feed-item";
import { getAuthorLabel } from "@/lib/posts/feed-item";

/** 路由 `/drafts`；列表项映射为 Feed 卡片格式供 DraftsPage 渲染与删除。 */
export default async function DraftsRoute() {
  const user = await getCurrentUser();

  const drafts = user
    ? await prisma.draft.findMany({
        where: buildDraftListWhere(user.id),
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          coverUrl: true,
          updatedAt: true,
          prompt: {
            select: { title: true },
          },
        },
      })
    : [];

  const authorLabel = user ? getAuthorLabel(user) : "我";
  const feedItems = drafts.map((draft) =>
    mapDraftToFeedItem(draft, authorLabel, user?.id ?? "")
  );

  return (
    <ContentPanel>
      <DraftsPage items={feedItems} userId={user?.id} />
    </ContentPanel>
  );
}
