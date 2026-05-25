import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  PostStatus,
  PrismaClient,
  ReviewRiskLevel,
  ReviewStatus,
} from "../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置，无法回填测试文章质量分");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

const ACCOUNTS_PATH = path.join(
  process.cwd(),
  "local",
  "test-accounts",
  "accounts.json"
);

/** 与 seed-test-posts 一致的折合算法，保证回填结果可复现。 */
function deriveTestQualityScore(input: {
  viewCount: number;
  likeCount: number;
}) {
  const engagement = input.likeCount * 3 + input.viewCount;
  const normalized =
    Math.log10(engagement + 1) / Math.log10(200_000);
  const score = 52 + normalized * 40;
  return Math.round(Math.min(92, Math.max(52, score)));
}

async function resolveTestUserIds() {
  try {
    const raw = await readFile(ACCOUNTS_PATH, "utf8");
    const parsed = JSON.parse(raw) as {
      accounts: { userId: string }[];
    };
    return parsed.accounts.map((account) => account.userId);
  } catch {
    console.warn(
      "未读取到 local/test-accounts/accounts.json，将回填全部已发布且缺质量分的文章。"
    );
    return null;
  }
}

async function main() {
  const testUserIds = await resolveTestUserIds();

  const posts = await prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      qualityScore: null,
      ...(testUserIds?.length
        ? { userId: { in: testUserIds } }
        : {}),
    },
    select: {
      id: true,
      title: true,
      viewCount: true,
      likeCount: true,
      publishedAt: true,
      updatedAt: true,
    },
  });

  if (posts.length === 0) {
    console.log("没有需要回填质量分的测试文章。");
    return;
  }

  let updated = 0;

  for (const post of posts) {
    const qualityScore = deriveTestQualityScore(post);
    await prisma.post.update({
      where: { id: post.id },
      data: {
        qualityScore,
        reviewStatus: ReviewStatus.PASSED,
        reviewRiskLevel: ReviewRiskLevel.NONE,
        reviewedAt: post.publishedAt ?? post.updatedAt,
      },
    });
    updated += 1;
    console.log(`  ✓ ${post.title} → 质量分 ${qualityScore}`);
  }

  console.log(`\n回填完成：${updated} 篇文章已恢复模拟质量分与审核状态。`);
}

main()
  .catch((error) => {
    console.error("backfill-test-post-quality 执行失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
