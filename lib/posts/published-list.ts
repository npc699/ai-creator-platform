import { PostStatus, type Prisma } from "@/lib/generated/prisma/client";

import type { PublishedFilter } from "./panel-params";

/** 已发布页列表查询条件：全部含上线与下线，其余 Tab 按状态或排序维度筛选。 */
export function buildPublishedListWhere(
  userId: string,
  filter: PublishedFilter
): Prisma.PostWhereInput {
  const base = { userId };

  if (filter === "online") {
    return { ...base, status: PostStatus.PUBLISHED };
  }

  if (filter === "offline") {
    return { ...base, status: PostStatus.ARCHIVED };
  }

  return {
    ...base,
    status: { in: [PostStatus.PUBLISHED, PostStatus.ARCHIVED] },
  };
}

export function buildPublishedListOrderBy(
  filter: PublishedFilter
): Prisma.PostOrderByWithRelationInput[] {
  if (filter === "views") {
    return [{ viewCount: "desc" }, { updatedAt: "desc" }];
  }

  if (filter === "likes") {
    return [{ likeCount: "desc" }, { updatedAt: "desc" }];
  }

  return [{ publishedAt: "desc" }, { updatedAt: "desc" }];
}

export function getPublishedEmptyMessage(filter: PublishedFilter) {
  switch (filter) {
    case "online":
      return "还没有已上线的文章";
    case "offline":
      return "还没有已下线的文章";
    case "views":
      return "暂无可按浏览量排序的文章";
    case "likes":
      return "暂无可按点赞量排序的文章";
    default:
      return "还没有已发布的文章";
  }
}
