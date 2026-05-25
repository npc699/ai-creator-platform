export const POST_MAX_TAGS = 8;
export const POST_MAX_TAG_LENGTH = 20;

export type NormalizePostTagResult =
  | { ok: true; tag: string }
  | { ok: false; message: string };

/** 规范化用户输入的标签文案，供编辑器与 API 校验共用。 */
export function normalizePostTag(raw: string): NormalizePostTagResult {
  const tag = raw.trim();

  if (!tag) {
    return { ok: false, message: "标签不能为空" };
  }

  if (tag.length > POST_MAX_TAG_LENGTH) {
    return {
      ok: false,
      message: `单个标签不能超过 ${POST_MAX_TAG_LENGTH} 字`,
    };
  }

  return { ok: true, tag };
}

export function canAddPostTag(tags: string[], nextTag: string) {
  if (tags.length >= POST_MAX_TAGS) {
    return { ok: false as const, message: `标签不能超过 ${POST_MAX_TAGS} 个` };
  }

  if (tags.some((item) => item === nextTag)) {
    return { ok: false as const, message: "标签已存在" };
  }

  return { ok: true as const };
}
