// 运维回填：为测试用户已发布但缺质量分/审核记录的文章补模拟审核数据。
// 运行：npm run db:backfill:test-quality；常规 seed-test-posts 已写入时可跳过。
import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  PostStatus,
  PrismaClient,
  ReviewRiskLevel,
  ReviewStatus,
  ReviewType,
} from "../../../lib/generated/prisma/client";
import { buildMockReviewBundle } from "../seeds/mock-review-data";

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
      ...(testUserIds?.length ? { userId: { in: testUserIds } } : {}),
    },
    select: {
      id: true,
      userId: true,
      title: true,
      content: true,
      tags: true,
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
    const review = buildMockReviewBundle({
      title: post.title,
      content: post.content,
      tags: post.tags,
    });

    await prisma.$transaction([
      prisma.post.update({
        where: { id: post.id },
        data: {
          qualityScore: review.qualityScore,
          reviewStatus: ReviewStatus.PASSED,
          reviewRiskLevel: ReviewRiskLevel.NONE,
          reviewedAt: post.publishedAt ?? post.updatedAt,
        },
      }),
      prisma.reviewRecord.create({
        data: {
          postId: post.id,
          userId: post.userId,
          reviewType: ReviewType.PUBLISH,
          contentHash: review.contentHash,
          passed: true,
          riskLevel: ReviewRiskLevel.NONE,
          categories: [],
          qualityScore: review.qualityScore,
          result: review.result,
        },
      }),
    ]);

    updated += 1;
    console.log(`  ✓ ${post.title} → 质量分 ${review.qualityScore}`);
  }

  console.log(`\n回填完成：${updated} 篇文章已恢复模拟质量分与审核记录。`);
}

main()
  .catch((error) => {
    console.error("backfill-test-post-quality 执行失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
