/** 创作者统计数字展示（与右侧边栏一致，≥1 万用「万」）。 */
export function formatCreatorStatCount(count: number): string {
  if (count >= 10_000) {
    return `${(count / 10_000).toFixed(1).replace(/\.0$/, "")}万`;
  }
  return count.toLocaleString("zh-CN");
}
