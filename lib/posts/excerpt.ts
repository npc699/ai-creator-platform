/** 从 TipTap HTML 提取纯文本摘要，供列表页展示。 */
export type BuildPostExcerptOptions = {
  hasCover?: boolean;
  /**
   * @deprecated 已与 hasCover 合并为列表规则（96/140），保留仅为兼容旧调用。
   */
  channelList?: boolean;
};

/** 列表有封面：双行窄栏（约每行 48 字）。 */
const EXCERPT_LIST_WITH_COVER = 96;
/** 列表无封面：双行宽栏。 */
const EXCERPT_LIST_WITHOUT_COVER = 140;

function stripHtmlToText(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
}

/** Feed 列表卡片摘要：有封面 96 字，无封面 140 字。 */
export function buildFeedListExcerpt(html: string, hasCover = false) {
  const maxLength = hasCover ? EXCERPT_LIST_WITH_COVER : EXCERPT_LIST_WITHOUT_COVER;
  return truncateText(stripHtmlToText(html), maxLength);
}

export function buildPostExcerpt(
  html: string,
  options?: BuildPostExcerptOptions | number
) {
  if (typeof options === "number") {
    return truncateText(stripHtmlToText(html), options);
  }

  if (options?.hasCover !== undefined || options?.channelList) {
    return buildFeedListExcerpt(html, Boolean(options.hasCover));
  }

  return truncateText(stripHtmlToText(html), EXCERPT_LIST_WITHOUT_COVER);
}
