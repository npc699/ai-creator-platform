/**
 * 热点/爆文公式手工验算：用固定样本核对排序是否符合预期。
 * 运行：npx tsx scripts/feed-score-sanity.ts
 */
import { computeHotScore, computeViralScore } from "../lib/feed/scores/rankings";

const now = new Date("2026-05-26T12:00:00.000Z");

const samples = [
  {
    label: "高浏览新文",
    likeCount: 50,
    viewCount: 12000,
    qualityScore: 70,
    publishedAt: new Date("2026-05-25T10:00:00.000Z"),
    updatedAt: new Date("2026-05-25T10:00:00.000Z"),
  },
  {
    label: "高质量老文",
    likeCount: 200,
    viewCount: 8000,
    qualityScore: 92,
    publishedAt: new Date("2026-05-20T08:00:00.000Z"),
    updatedAt: new Date("2026-05-20T08:00:00.000Z"),
  },
  {
    label: "低质高赞",
    likeCount: 500,
    viewCount: 3000,
    qualityScore: 40,
    publishedAt: new Date("2026-05-24T08:00:00.000Z"),
    updatedAt: new Date("2026-05-24T08:00:00.000Z"),
  },
] as const;

type Sample = (typeof samples)[number];

function rankBy(items: readonly Sample[], scoreFn: (item: Sample) => number) {
  return [...items]
    .map((item) => ({ label: item.label, score: scoreFn(item) }))
    .sort((a, b) => b.score - a.score);
}

console.log("=== 热点榜排序（预期：高浏览新文靠前）===");
console.table(rankBy(samples, (s) => computeHotScore({ ...s, now })));

console.log("=== 爆文榜排序（预期：高质量老文可超过低质高赞）===");
console.table(rankBy(samples, (s) => computeViralScore({ ...s, now })));
