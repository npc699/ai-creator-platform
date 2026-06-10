// 可选种子：为 5 个测试用户各写入 5 篇已发布文章，并生成模拟审核记录。
// 运行：npm run db:seed:test-posts；建议顺序：db:seed → db:seed:test-users → 本脚本。
// 同 label+标题会先 deleteMany 再 create，可重复执行。
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
import {
  buildMockReviewBundle,
  countTextChars,
  randomEngagementMetrics,
} from "./mock-review-data";
import { ACCOUNT_POST_TEMPLATES } from "./test-posts-content";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置，无法生成测试文章");
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

const MIN_CHARS = 400;
const MAX_CHARS = 500;

function toHtml(paragraphs: string[]) {
  return paragraphs.map((text) => `<p>${text}</p>`).join("");
}

function buildPlainContent(paragraphs: string[]) {
  return paragraphs.join("\n\n");
}

function assertContentLength(title: string, paragraphs: string[]) {
  const count = countTextChars(buildPlainContent(paragraphs));
  if (count < MIN_CHARS || count > MAX_CHARS) {
    throw new Error(
      `[${title}] 正文字数 ${count}，要求 ${MIN_CHARS}-${MAX_CHARS} 字`
    );
  }
}

function publishedAtFromDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(10 + (daysAgo % 8), 30, 0, 0);
  return date;
}

async function resolveAccountTemplates() {
  try {
    await readFile(ACCOUNTS_PATH, "utf8");
  } catch {
    console.warn(
      "未读取到 local/test-accounts/accounts.json，请先运行 npm run db:seed:test-users。"
    );
  }

  return ACCOUNT_POST_TEMPLATES;
}

async function main() {
  const seeds = await resolveAccountTemplates();
  const allTitles = seeds.flatMap((account) =>
    account.posts.map((post) => post.title)
  );

  for (const account of seeds) {
    for (const post of account.posts) {
      assertContentLength(post.title, post.paragraphs);
    }
  }

  const userIds = (
    await prisma.user.findMany({
      where: { name: { in: seeds.map((account) => account.label) } },
      select: { id: true },
    })
  ).map((user) => user.id);

  const deleted = await prisma.post.deleteMany({
    where: {
      ...(userIds.length ? { userId: { in: userIds } } : {}),
      title: { in: allTitles },
    },
  });

  let created = 0;

  for (const account of seeds) {
    const user = await prisma.user.findFirst({
      where: { name: account.label },
      select: { id: true, name: true },
    });

    if (!user) {
      console.warn(`跳过 ${account.label}：请先运行 npm run db:seed:test-users`);
      continue;
    }

    for (const [index, post] of account.posts.entries()) {
      const plainContent = buildPlainContent(post.paragraphs);
      const htmlContent = toHtml(post.paragraphs);
      const publishedAt = publishedAtFromDaysAgo(post.daysAgo);
      const { viewCount, likeCount } = randomEngagementMetrics();
      const review = buildMockReviewBundle({
        title: post.title,
        content: htmlContent,
        tags: post.tags,
        salt: index + post.daysAgo,
      });

      await prisma.post.create({
        data: {
          userId: user.id,
          title: post.title,
          content: htmlContent,
          status: PostStatus.PUBLISHED,
          publishedAt,
          viewCount,
          likeCount,
          tags: post.tags,
          qualityScore: review.qualityScore,
          reviewStatus: ReviewStatus.PASSED,
          reviewRiskLevel: ReviewRiskLevel.NONE,
          reviewedAt: publishedAt,
          reviewRecords: {
            create: {
              userId: user.id,
              reviewType: ReviewType.PUBLISH,
              contentHash: review.contentHash,
              passed: true,
              riskLevel: ReviewRiskLevel.NONE,
              categories: [],
              qualityScore: review.qualityScore,
              result: review.result,
            },
          },
        },
      });

      created += 1;
      console.log(
        `  ✓ [${account.label}] ${post.title}（${countTextChars(plainContent)} 字，浏览 ${viewCount} / 点赞 ${likeCount} / 质量分 ${review.qualityScore}）`
      );
    }
  }

  console.log("\n测试文章生成完成：");
  console.log(`  删除旧稿（同标题）: ${deleted.count} 篇`);
  console.log(`  新建已发布文章: ${created} 篇`);
  console.log(`  预期账号数: ${seeds.length}`);
  console.log("\n说明：可在首页 Feed、作者主页与文章详情页查看模拟审核细项。");
}

main()
  .catch((error) => {
    console.error("seed-test-posts 执行失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
