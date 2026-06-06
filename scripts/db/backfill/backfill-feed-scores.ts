// 运维回填：调用 lib/feed/scores/refresh 刷新近 7 天文章的 hotScore/viralScore（与 Cron 同逻辑）。
// 运行：npm run db:backfill:feed-scores；seed 测试文后建议执行，否则榜单排序可能全为 0。
import "dotenv/config";

import { refreshFeedScores } from "../../../lib/feed/scores/refresh";

async function main() {
  const result = await refreshFeedScores();
  console.log(`已刷新 ${result.updated} 篇文章（自 ${result.since} 起）`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
