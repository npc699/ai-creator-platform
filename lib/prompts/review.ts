export const REVIEW_PROMPT_VERSION = "review-v1.0.0";

export const REVIEW_CATEGORY_LABELS = {
  pornography: "涉黄",
  gambling: "涉赌",
  drugs: "涉毒",
  political_sensitive: "政治敏感",
  harassment: "人身攻击",
  vulgar: "低俗内容",
  misinformation: "虚假信息",
} as const;

export const QUALITY_DIMENSION_WEIGHTS = {
  titleAppeal: 0.15,
  completeness: 0.25,
  structure: 0.2,
  readability: 0.15,
  originality: 0.15,
  imageRelevance: 0.1,
} as const;

const jsonContract = `{
  "safety": {
    "passed": boolean,
    "riskLevel": "high" | "medium" | "low" | "none",
    "categories": string[],
    "reason": string,
    "suggestion": string
  },
  "quality": {
    "dimensions": {
      "titleAppeal": { "score": number, "reason": string },
      "completeness": { "score": number, "reason": string },
      "structure": { "score": number, "reason": string },
      "readability": { "score": number, "reason": string },
      "originality": { "score": number, "reason": string },
      "imageRelevance": { "score": number, "reason": string }
    },
    "overallScore": number,
    "summary": string
  }
}`;

export function buildReviewSystemPrompt() {
  return `你是 AI 创作平台的内容安全与质量审核员。请严格基于中国大陆公开内容平台常见规范，对用户文章做安全审核和质量评分。

安全审核类别只能使用：
- pornography：涉黄、性暗示交易、色情引流。
- gambling：赌博、博彩、赌球、私彩、赌资交易。
- drugs：毒品制作、购买、吸食、美化毒品。
- political_sensitive：政治谣言、煽动性政治攻击、涉政敏感动员。
- harassment：人身攻击、侮辱、歧视、网暴引导。
- vulgar：低俗猎奇、恶俗擦边、未成年人不适宜表达。
- misinformation：明显虚假信息、医疗/金融等高风险误导。

风险等级：
- high：明确违法违规、诱导交易、教学实施、煽动伤害或明显高危内容，必须拦截。
- medium：存在较强风险或事实不确定，需要用户修改或人工复核。
- low：轻微不当、措辞粗糙或质量边界问题，可提示优化。
- none：未发现明显风险。

用户标签也需纳入安全审核。如果标签中包含违规关键词（如涉黄、涉赌、毒品相关等），即使正文合规，也应判定为不通过并在 categories 和 reason 中说明。标签与正文主题严重不符时可在质量评分的标题吸引力或内容完整度维度中酌情扣分。

质量评分每项 0-10 分，综合分 0-100 分。权重：标题吸引力 15%，内容完整度 25%，逻辑结构 20%，可读性 15%，原创性 15%，配图相关性 10%。如果文章没有图片，配图相关性按内容是否需要配图来评分，不应直接给 0。

请只返回可解析 JSON，不要包含 Markdown、解释性前后缀或代码块。JSON 结构必须完全符合：
${jsonContract}`;
}

export function buildReviewUserPrompt(input: {
  title: string;
  plainText: string;
  html: string;
  imageCount: number;
  tags: string[];
}) {
  const tagsLine = input.tags.length
    ? `\n\n用户标签：\n${input.tags.join(", ")}`
    : "";

  return `请审核以下文章：

标题：
${input.title}${tagsLine}

正文纯文本：
${input.plainText}

HTML 结构摘要：
图片数量：${input.imageCount}
HTML：
${input.html.slice(0, 12000)}`;
}

export function buildCompliantRewriteSystemPrompt() {
  return `你是内容合规改写助手。目标是在保留用户原始主题、结构和表达意图的前提下，删除违法违规、低俗、攻击性或误导性内容，改写为适合公开发布的版本。

要求：
- 不编造新的敏感细节。
- 不保留规避审核、交易引流、攻击辱骂、违法教学等内容。
- 尽量保留 HTML 段落结构；如果输入不是 HTML，则输出自然段文本。
- 只返回 JSON，不要包含 Markdown 或代码块。

JSON 结构：
{
  "title": string,
  "content": string,
  "summary": string
}`;
}

export function buildCompliantRewriteUserPrompt(input: {
  title: string;
  content: string;
  reason: string;
  categories: string[];
}) {
  return `请生成合规替代版本。

违规类别：${input.categories.join(", ") || "未指定"}
违规原因：${input.reason}

原标题：
${input.title}

原文：
${input.content}`;
}
