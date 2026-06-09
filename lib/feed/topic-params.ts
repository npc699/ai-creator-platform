import { HOME_TOPIC_TAGS } from "@/lib/feed/home/list";

/** 将文章标签编码为首页 topic 查询参数。 */
export function encodeTopicParam(tag: string): string {
  return encodeURIComponent(tag.trim());
}

/** 解析 topic 查询参数为展示用标签名（动态话题）。 */
export function decodeTopicParam(topic: string | null | undefined): string | null {
  if (!topic) {
    return null;
  }

  if (HOME_TOPIC_TAGS[topic]) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(topic).trim();
    return decoded || null;
  } catch {
    const trimmed = topic.trim();
    return trimmed || null;
  }
}

/**
 * 将 topic 参数解析为 Prisma tags 筛选条件。
 * 兼容旧版侧栏 slug（HOME_TOPIC_TAGS）与新版真实标签名。
 */
export function resolveTopicTagFilter(
  topic: string | null | undefined
): string[] | null {
  if (!topic) {
    return null;
  }

  const legacy = HOME_TOPIC_TAGS[topic];
  if (legacy?.length) {
    return legacy;
  }

  const decoded = decodeTopicParam(topic);
  return decoded ? [decoded] : null;
}
