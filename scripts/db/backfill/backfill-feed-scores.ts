// 运维回填：刷新近 7 天文章的 hotScore/viralScore（与 Cron 同逻辑）。
// 运行：npm run db:backfill:feed-scores；seed 测试文后建议执行，否则榜单排序可能全为 0。
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { computeHotScore, computeViralScore } from "../../../lib/feed/scores/rankings";
import { getFeedRankingSince } from "../../../lib/feed/scores/window";
import { PostStatus, PrismaClient } from "../../../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置，无法回填 Feed 分数");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

const BATCH_SIZE = 100;

async function main() {
  const now = new Date();
  const since = getFeedRankingSince(now);

  const posts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      publishedAt: { gte: since },
    },
    select: {
      id: true,
      likeCount: true,
      viewCount: true,
      qualityScore: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  for (let offset = 0; offset < posts.length; offset += BATCH_SIZE) {
    const batch = posts.slice(offset, offset + BATCH_SIZE);
    await prisma.$transaction(
      batch.map((post) =>
        prisma.post.update({
          where: { id: post.id },
          data: {
            hotScore: computeHotScore({ ...post, now }),
            viralScore: computeViralScore({ ...post, now }),
            scoreUpdatedAt: now,
          },
        })
      )
    );
  }

  console.log(`已刷新 ${posts.length} 篇文章（自 ${since.toISOString()} 起）`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
