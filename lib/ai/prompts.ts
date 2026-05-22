import type { ArkChatMessage } from "./ark";
import type { AiGenerateRequest } from "./schema";

/** 统一约束输出为纯文本，避免流式 chunk 切断 HTML/Markdown 标签。 */
const OUTPUT_RULES = [
  "只输出正文纯文本，不要输出标题符号（如 #）、Markdown、HTML 或代码块围栏。",
  "段落之间使用两个换行符分隔。",
  "不要输出解释性前后缀（如「以下是正文：」）。",
].join("\n");

const BASE_SYSTEM_PROMPT = [
  "你是一名中文内容创作助手，负责为创作者平台生成可直接粘贴进编辑器的正文。",
  "严格遵循用户在消息中给出的写作要求，包括但不限于：主题、语气、风格、目标读者、篇幅长短与结构安排。",
  "若用户未明确指定篇幅或风格，则根据主题自行判断并保持内容完整、连贯。",
  OUTPUT_RULES,
].join("\n");

function buildGenerateMessages(input: AiGenerateRequest): ArkChatMessage[] {
  const keyword = input.keyword?.trim() ?? "";

  return [
    {
      role: "system",
      content: [
        BASE_SYSTEM_PROMPT,
        "根据用户的写作指令撰写结构完整的文章正文，需有清晰起承转合，不要写标题行。",
      ].join("\n"),
    },
    {
      role: "user",
      content: keyword,
    },
  ];
}

function buildPolishMessages(input: AiGenerateRequest): ArkChatMessage[] {
  const context = input.context?.trim() ?? "";

  return [
    {
      role: "system",
      content: [
        BASE_SYSTEM_PROMPT,
        "对用户提供的文本进行润色：保持原意，优化表达、衔接与可读性。",
        "只输出润色后的正文，不要点评或列改动说明。",
      ].join("\n"),
    },
    {
      role: "user",
      content: `待润色文本：\n${context}`,
    },
  ];
}

function buildSelectionMessages(input: AiGenerateRequest): ArkChatMessage[] {
  const instruction = input.keyword?.trim() ?? "";
  const context = input.context?.trim() ?? "";

  return [
    {
      role: "system",
      content: [
        BASE_SYSTEM_PROMPT,
        "用户会提供一段已选中的原文，以及针对这段原文的具体处理要求。",
        "必须以用户处理要求为最高优先级，只输出处理后的正文，不要解释你的操作。",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        `处理要求：${instruction}`,
        "",
        "选中原文：",
        context,
      ].join("\n"),
    },
  ];
}

function buildExpandMessages(input: AiGenerateRequest): ArkChatMessage[] {
  const context = input.context?.trim() ?? "";

  return [
    {
      role: "system",
      content: [
        BASE_SYSTEM_PROMPT,
        "对用户提供的文本进行扩写：补充细节、例子或论证，使内容更充实。",
        "只输出扩写后的正文，不要重复原文后再追加。",
      ].join("\n"),
    },
    {
      role: "user",
      content: `待扩写文本：\n${context}`,
    },
  ];
}

function buildShrinkMessages(input: AiGenerateRequest): ArkChatMessage[] {
  const context = input.context?.trim() ?? "";

  return [
    {
      role: "system",
      content: [
        BASE_SYSTEM_PROMPT,
        "对用户提供的文本进行精简压缩：在保留核心信息与逻辑的前提下删除冗余表述。",
        "篇幅应明显短于原文，约为原文的 50%-70%，除非用户另有说明。",
      ].join("\n"),
    },
    {
      role: "user",
      content: `待精简文本：\n${context}`,
    },
  ];
}

/** 按 mode 组装火山方舟 Chat Completions 所需的 messages。 */
export function buildAiMessages(input: AiGenerateRequest): ArkChatMessage[] {
  switch (input.mode) {
    case "generate":
      return buildGenerateMessages(input);
    case "selection":
      return buildSelectionMessages(input);
    case "polish":
      return buildPolishMessages(input);
    case "expand":
      return buildExpandMessages(input);
    case "shrink":
      return buildShrinkMessages(input);
  }
}
