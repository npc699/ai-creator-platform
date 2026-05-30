import { z } from "zod";

import type { Prisma } from "@/lib/generated/prisma/client";
import type { FeedChannelParam, FeedSort } from "@/lib/feed/params";
import { HOT_FORMULA_VERSION } from "@/lib/feed/hot-score";
import { VIRAL_FORMULA_VERSION } from "@/lib/feed/viral-score";
import {
  computeHomeRecommendScore,
  RECOMMEND_FORMULA_VERSION,
} from "@/lib/posts/home-recommend-score";

/** 首页 Feed 分页模式，与 orderBy 字段一一对应。 */
export type HomePaginationMode =
  | "latest"
  | "likes"
  | "views"
  | "recommend"
  | "hot"
  | "viral";

const isoDate = z.string().datetime();

const homeCursorSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("latest"),
    publishedAt: isoDate,
    id: z.string().min(1),
  }),
  z.object({
    mode: z.literal("likes"),
    likeCount: z.number().int().nonnegative(),
    publishedAt: isoDate,
    id: z.string().min(1),
  }),
  z.object({
    mode: z.literal("views"),
    viewCount: z.number().int().nonnegative(),
    publishedAt: isoDate,
    id: z.string().min(1),
  }),
  z.object({
    mode: z.literal("recommend"),
    score: z.number().finite(),
    id: z.string().min(1),
    /** 推荐分计算的固定参考时间，整段翻页会话内保持一致 */
    asOf: isoDate,
    /** 推荐分公式版本；缺失或非当前版本时分页游标作废 */
    formulaVersion: z.number().int().positive().optional(),
  }),
  z.object({
    mode: z.literal("hot"),
    hotScore: z.number().finite(),
    publishedAt: isoDate,
    id: z.string().min(1),
    formulaVersion: z.number().int().positive().optional(),
    /** 上一页已展示条数，用于深页继续展示全局排名。 */
    offset: z.number().int().nonnegative().optional(),
  }),
  z.object({
    mode: z.literal("viral"),
    viralScore: z.number().finite(),
    publishedAt: isoDate,
    id: z.string().min(1),
    formulaVersion: z.number().int().positive().optional(),
  }),
]);

export type HomeFeedCursor = z.infer<typeof homeCursorSchema>;

type PostCursorSource = {
  id: string;
  publishedAt: Date | null;
  updatedAt: Date;
  viewCount: number;
  likeCount: number;
  hotScore?: number;
  viralScore?: number;
  qualityScore?: number | null;
};

export function resolveHomePaginationMode(
  channel: FeedChannelParam,
  sort: FeedSort
): HomePaginationMode {
  if (channel === "hot") {
    return "hot";
  }
  if (channel === "viral") {
    return "viral";
  }
  if (sort === "latest") {
    return "latest";
  }
  if (sort === "likes") {
    return "likes";
  }
  if (sort === "views") {
    return "views";
  }
  return "recommend";
}

/** 排序用时间：已发布文优先 publishedAt，否则回退 updatedAt。 */
function getSortPublishedAt(post: PostCursorSource) {
  return post.publishedAt ?? post.updatedAt;
}

export function buildHomeCursorFromPost(
  post: PostCursorSource,
  mode: HomePaginationMode,
  options?: { scoreAsOf?: Date; hotOffset?: number }
): HomeFeedCursor {
  const publishedAt = getSortPublishedAt(post).toISOString();
  const scoreAsOf = options?.scoreAsOf ?? new Date();

  switch (mode) {
    case "latest":
      return { mode, publishedAt, id: post.id };
    case "likes":
      return {
        mode,
        likeCount: post.likeCount,
        publishedAt,
        id: post.id,
      };
    case "views":
      return {
        mode,
        viewCount: post.viewCount,
        publishedAt,
        id: post.id,
      };
    case "recommend":
      return {
        mode,
        score: computeHomeRecommendScore({
          likeCount: post.likeCount,
          viewCount: post.viewCount,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          qualityScore: post.qualityScore,
          now: scoreAsOf,
        }),
        id: post.id,
        asOf: scoreAsOf.toISOString(),
        formulaVersion: RECOMMEND_FORMULA_VERSION,
      };
    case "hot":
      return {
        mode,
        hotScore: post.hotScore ?? 0,
        publishedAt,
        id: post.id,
        formulaVersion: HOT_FORMULA_VERSION,
        ...(options?.hotOffset != null ? { offset: options.hotOffset } : {}),
      };
    case "viral":
      return {
        mode,
        viralScore: post.viralScore ?? 0,
        publishedAt,
        id: post.id,
        formulaVersion: VIRAL_FORMULA_VERSION,
      };
  }
}

export function encodeHomeCursor(cursor: HomeFeedCursor): string {
  const json = JSON.stringify(cursor);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeHomeCursor(
  raw: string | null | undefined
): HomeFeedCursor | null {
  if (!raw?.trim()) {
    return null;
  }

  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = homeCursorSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** DESC 排序下的 keyset：取字典序严格小于游标的下一页。 */
export function buildHomeCursorWhere(
  cursor: HomeFeedCursor
): Prisma.PostWhereInput {
  switch (cursor.mode) {
    case "recommend":
      // 综合分排序走 raw SQL，此处不应被 Prisma findMany 调用
      return {};
    case "latest": {
      const publishedAt = new Date(cursor.publishedAt);
      return {
        OR: [
          { publishedAt: { lt: publishedAt } },
          { publishedAt, id: { lt: cursor.id } },
        ],
      };
    }
    case "likes": {
      const publishedAt = new Date(cursor.publishedAt);
      return {
        OR: [
          { likeCount: { lt: cursor.likeCount } },
          {
            likeCount: cursor.likeCount,
            publishedAt: { lt: publishedAt },
          },
          {
            likeCount: cursor.likeCount,
            publishedAt,
            id: { lt: cursor.id },
          },
        ],
      };
    }
    case "views": {
      const publishedAt = new Date(cursor.publishedAt);
      return {
        OR: [
          { viewCount: { lt: cursor.viewCount } },
          {
            viewCount: cursor.viewCount,
            publishedAt: { lt: publishedAt },
          },
          {
            viewCount: cursor.viewCount,
            publishedAt,
            id: { lt: cursor.id },
          },
        ],
      };
    }
    case "hot": {
      if (cursor.formulaVersion !== HOT_FORMULA_VERSION) {
        return {};
      }
      const publishedAt = new Date(cursor.publishedAt);
      return {
        OR: [
          { hotScore: { lt: cursor.hotScore } },
          {
            hotScore: cursor.hotScore,
            publishedAt: { lt: publishedAt },
          },
          {
            hotScore: cursor.hotScore,
            publishedAt,
            id: { lt: cursor.id },
          },
        ],
      };
    }
    case "viral": {
      if (cursor.formulaVersion !== VIRAL_FORMULA_VERSION) {
        return {};
      }
      const publishedAt = new Date(cursor.publishedAt);
      return {
        OR: [
          { viralScore: { lt: cursor.viralScore } },
          {
            viralScore: cursor.viralScore,
            publishedAt: { lt: publishedAt },
          },
          {
            viralScore: cursor.viralScore,
            publishedAt,
            id: { lt: cursor.id },
          },
        ],
      };
    }
  }
}
