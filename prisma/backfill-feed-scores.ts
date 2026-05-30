/**
 * 一次性回填近 7 天文章的热点/爆文预计算分。
 * 运行：npx tsx prisma/backfill-feed-scores.ts
 */
import "dotenv/config";

import { refreshFeedScores } from "../lib/feed/refresh-scores";

async function main() {
  const result = await refreshFeedScores();
  console.log(`已刷新 ${result.updated} 篇文章（自 ${result.since} 起）`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
