import "server-only";

import { prisma } from "@/lib/db";
import { CHANNEL_META } from "@/lib/feed/params";
import {
  buildHomeListOrderBy,
  buildHomeListWhere,
} from "@/lib/feed/home/list";
import { buildPostHref } from "@/lib/posts/reader-navigation";

export const HOT_SIDEBAR_RANKING_LIMIT = 5;

/** 侧栏热点榜条目，与主区热点频道同一排序口径。 */
export type HotSidebarRankItem = {
  rank: number;
  postId: string;
  title: string;
  href: string;
  /** 副文案，如「1.2万热度」 */
  metricLabel: string;
};

function formatHotMetricLabel(views: number, likes: number): string {
  const heat = views + likes;
  if (heat >= 10_000) {
    return `${(heat / 10_000).toFixed(1).replace(/\.0$/, "")}万热度`;
  }
  return `${heat.toLocaleString("zh-CN")}热度`;
}

/** 侧栏热点榜 Top N，数据与 `/?channel=hot` 榜单一致。 */
export async function fetchHotSidebarRanking(
  limit = HOT_SIDEBAR_RANKING_LIMIT
): Promise<HotSidebarRankItem[]> {
  const hotReturnPath = "/?channel=hot";

  const posts = await prisma.post.findMany({
    where: buildHomeListWhere(null, null, "hot"),
    orderBy: buildHomeListOrderBy("hot", "recommend"),
    take: limit,
    select: {
      id: true,
      title: true,
      viewCount: true,
      likeCount: true,
    },
  });

  return posts.map((post, index) => ({
    rank: index + 1,
    postId: post.id,
    title: post.title,
    href: buildPostHref(post.id, hotReturnPath),
    metricLabel: formatHotMetricLabel(post.viewCount, post.likeCount),
  }));
}

export const HOT_SIDEBAR_META = CHANNEL_META.hot;
