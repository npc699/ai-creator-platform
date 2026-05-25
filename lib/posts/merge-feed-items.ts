/** 按 id 合并 Feed 列表，保留先出现的项，避免分页漂移或恢复时重复。 */
export function mergeUniqueFeedItems<T extends { id: string }>(
  existing: T[],
  incoming: T[]
): T[] {
  if (incoming.length === 0) {
    return existing;
  }

  const seen = new Set(existing.map((item) => item.id));
  const merged = [...existing];

  for (const item of incoming) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }

  return merged;
}
