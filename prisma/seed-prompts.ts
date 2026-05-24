import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type PromptCategory } from "../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置，无法写入测试 Prompt");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

type SeedPrompt = {
  title: string;
  content: string;
  category: PromptCategory;
  isFavorite?: boolean;
  usageCount?: number;
};

/** 用于判断是否已写入测试数据的锚点标题（首个种子条目）。 */
const SEED_ANCHOR_TITLE = "痛点-方案型长文";

const TEST_PROMPTS: SeedPrompt[] = [
  // 长文写作
  {
    category: "LONG_FORM",
    title: "痛点-方案型长文",
    content: `请写一篇 1500 字以上的长文，结构如下：
1. 开头用具体场景描述读者痛点（100 字）
2. 分析痛点背后的 3 个根本原因
3. 提出可执行的解决方案（分步骤说明）
4. 用 1 个真实案例佐证效果
5. 结尾给出行动清单（3-5 条）
语气：专业但不晦涩，适合公众号/知乎发布。`,
    isFavorite: true,
    usageCount: 12,
  },
  {
    category: "LONG_FORM",
    title: "故事化叙事长文",
    content: `以第一人称视角写一篇故事型长文：
- 主角：一位普通职场人
- 冲突：遇到的具体困境
- 转折：尝试新方法后的变化
- 升华：提炼出可复用的经验
要求：有画面感、有对话、有情绪起伏，全文 1200-1800 字。`,
    usageCount: 5,
  },
  {
    category: "LONG_FORM",
    title: "数据驱动分析文",
    content: `围绕「{主题}」写一篇数据型长文：
1. 用 3 组数据/趋势说明现状
2. 解读数据背后的原因（至少 2 层）
3. 预测未来 6-12 个月走向
4. 给不同角色（个人/企业）各 2 条建议
数据可以合理推断，但逻辑要自洽。`,
    usageCount: 8,
  },
  {
    category: "LONG_FORM",
    title: "观点评论长文",
    content: `针对热点话题「{话题}」写一篇评论长文：
- 明确你的核心观点（一句话）
- 从 3 个角度论证（历史、对比、反方观点回应）
- 避免空泛，每个论点配具体例子
- 结尾不喊口号，给出冷静判断
字数 1000-1500，适合深度阅读平台。`,
  },

  // 短图文
  {
    category: "SHORT_POST",
    title: "三句话讲清观点",
    content: `用三句话输出一条短图文：
第 1 句：抛出反常识观点或问题
第 2 句：给出核心解释/方法
第 3 句：一句 actionable 的收尾
总字数 80-120 字，适合小红书/朋友圈。`,
    isFavorite: true,
    usageCount: 20,
  },
  {
    category: "SHORT_POST",
    title: "清单式短图文",
    content: `写一篇清单型短图文，主题「Desktop 效率提升」：
- 标题带数字（如「5 个习惯」）
- 每条 1 句话，不超过 20 字
- 最后加一句总结
整体 150-200 字，口语化、有节奏感。`,
    usageCount: 3,
  },
  {
    category: "SHORT_POST",
    title: "热点短评",
    content: `针对今日热点「{热点}」写一条短评：
1. 30 字内点明态度
2. 50 字说清理由
3. 20 字互动提问
不要蹭流量式标题，保持克制专业。`,
    usageCount: 7,
  },

  // 种草内容
  {
    category: "SEEDING",
    title: "场景种草",
    content: `为「{产品名}」写一篇种草文案：
- 开头描述一个具体使用场景（让人代入）
- 中间写 3 个真实使用感受（细节！）
- 结尾自然推荐，不要硬广
风格：像朋友分享，300-400 字。`,
    isFavorite: true,
    usageCount: 15,
  },
  {
    category: "SEEDING",
    title: "对比种草",
    content: `写一条 Before/After 种草内容：
Before：没用产品前的困扰（具体）
After：用了之后的改变（可量化更好）
中间过渡：为什么选这款产品（1-2 个理由）
适合小红书，200-300 字，带 2-3 个 emoji。`,
    usageCount: 9,
  },
  {
    category: "SEEDING",
    title: "清单种草",
    content: `写一篇「{场景}必备清单」种草文：
- 列出 3-5 个产品/工具
- 每个用 1 句话说明为什么推荐
- 按优先级排序
- 结尾总结「最值得买的一个」
字数 250-350。`,
    usageCount: 4,
  },
  {
    category: "SEEDING",
    title: "开箱第一印象",
    content: `模拟开箱体验写一篇种草：
1. 包装/外观第一印象（50 字）
2. 上手 3 个亮点
3. 1 个需要注意的小缺点（增加可信度）
4. 适合谁买 / 不适合谁
真实感优先，避免夸张形容词。`,
  },

  // 产品测评
  {
    category: "PRODUCT_REVIEW",
    title: "客观测评框架",
    content: `对「{产品名}」写客观测评：
## 基本信息（价格、定位）
## 优点（3 条，每条有依据）
## 缺点（2 条，不回避）
## 适合人群 / 不适合人群
## 综合评分（满分 10）+ 一句话总结
保持中立，不做软文。`,
    isFavorite: true,
    usageCount: 11,
  },
  {
    category: "PRODUCT_REVIEW",
    title: "性价比测评",
    content: `从性价比角度测评「{产品名}」：
- 同价位竞品对比（2-3 个）
- 核心差异点
- 值不值得买（分预算场景：学生/职场/专业）
800 字左右，结论要明确。`,
    usageCount: 6,
  },
  {
    category: "PRODUCT_REVIEW",
    title: "深度横评",
    content: `横向对比 A / B / C 三款「{品类}」：
| 维度 | A | B | C |
从性能、价格、体验、售后 4 个维度打分（1-5）
最后给出不同需求下的购买建议。`,
    usageCount: 2,
  },

  // 行业分析
  {
    category: "INDUSTRY",
    title: "行业趋势解读",
    content: `分析「{行业}」2025-2026 年趋势：
1. 当前阶段判断（萌芽/成长/成熟/衰退）
2. 3 个关键驱动因素
3. 2 个潜在风险
4. 对从业者的 3 条建议
800-1200 字，引用公开信息，标注「据行业报告/公开数据」。`,
    isFavorite: true,
    usageCount: 4,
  },
  {
    category: "INDUSTRY",
    title: "竞品格局分析",
    content: `分析「{行业}」竞争格局：
- 头部玩家及差异化定位
- 新进入者威胁
- 未来 1-2 年可能的格局变化
输出结构清晰，适合内部汇报或专栏文章。`,
    usageCount: 1,
  },
  {
    category: "INDUSTRY",
    title: "用户行为洞察",
    content: `基于「{产品/行业}」写用户行为洞察：
- 目标用户画像（2-3 类）
- 每类用户的核心诉求与决策路径
- 内容/产品可以切入的 3 个机会点
用数据或合理推断支撑，600-900 字。`,
    usageCount: 3,
  },

  // 标题生成
  {
    category: "TITLE_GEN",
    title: "爆款标题 10 条",
    content: `根据正文摘要「{摘要}」，生成 10 个标题：
- 3 个数字型（含具体数字）
- 3 个悬念型（激发好奇）
- 2 个痛点型（直击问题）
- 2 个利益型（明确收益）
每个标题 15-25 字，标注适用平台（公众号/小红书/知乎）。`,
    isFavorite: true,
    usageCount: 25,
  },
  {
    category: "TITLE_GEN",
    title: "悬念式标题",
    content: `为主题「{主题}」写 5 个悬念标题：
要求：不标题党、不夸大，但让人想点开
避免「震惊」「必看」等低质词汇
每个标题附 1 句说明「悬念点在哪」。`,
    usageCount: 14,
  },
  {
    category: "TITLE_GEN",
    title: "小红书标题",
    content: `为小红书笔记生成 8 个标题：
- 含 1-2 个 relevant emoji
- 15-20 字为主
- 覆盖：教程型、避坑型、清单型、对比型
主题：{主题}`,
    usageCount: 8,
  },
  {
    category: "TITLE_GEN",
    title: "A/B 标题测试",
    content: `为同一篇文章生成 A/B 两组标题各 3 个：
A 组：理性、专业向
B 组：情绪、共鸣向
并说明每组适合什么受众、什么发布渠道。`,
  },

  // 改写润色
  {
    category: "REWRITE",
    title: "口语化改写",
    content: `将以下文字改写成口语化风格：
---
{原文}
---
要求：像跟朋友聊天，句子短，去掉官话，保留核心信息，字数控制在原文 90%-110%。`,
    isFavorite: true,
    usageCount: 18,
  },
  {
    category: "REWRITE",
    title: "专业化润色",
    content: `将以下文字润色为专业商务风格：
---
{原文}
---
要求：用词准确、逻辑清晰、去掉口语和重复，适合发给客户或上级。`,
    usageCount: 10,
  },
  {
    category: "REWRITE",
    title: "精简压缩",
    content: `将以下文字压缩到原文 50% 字数以内，不丢关键信息：
---
{原文}
---
优先删修饰语和重复表达，保留论点和数据。`,
    usageCount: 6,
  },
  {
    category: "REWRITE",
    title: "扩写丰富细节",
    content: `将以下大纲扩写成完整段落（每点 80-120 字）：
---
{大纲}
---
补充具体例子、场景描写，让内容更生动可读。`,
    usageCount: 2,
  },
];

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  if (users.length === 0) {
    throw new Error("数据库中没有用户，请先运行 npx prisma db seed 创建账号");
  }

  let totalCreated = 0;

  for (const user of users) {
    const existing = await prisma.prompt.count({
      where: {
        userId: user.id,
        isOfficial: false,
        title: SEED_ANCHOR_TITLE,
      },
    });

    if (existing > 0) {
      console.log(
        `跳过 ${user.email ?? user.name ?? user.id}：已有 ${existing} 条测试 Prompt`
      );
      continue;
    }

    const created = await prisma.prompt.createMany({
      data: TEST_PROMPTS.map((prompt) => ({
        userId: user.id,
        title: prompt.title,
        content: prompt.content,
        category: prompt.category,
        isFavorite: prompt.isFavorite ?? false,
        usageCount: prompt.usageCount ?? 0,
      })),
    });

    totalCreated += created.count;
    console.log(
      `已为 ${user.email ?? user.name ?? user.id} 写入 ${created.count} 条测试 Prompt`
    );
  }

  if (totalCreated === 0) {
    console.log("所有用户均已有测试 Prompt 数据，未重复写入。");
    return;
  }

  const byCategory = TEST_PROMPTS.reduce<Record<string, number>>((acc, prompt) => {
    acc[prompt.category] = (acc[prompt.category] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`本次共写入 ${totalCreated} 条测试 Prompt，分类分布：`);
  for (const [category, count] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${count} 条`);
  }
}

main()
  .catch((error) => {
    console.error("写入测试 Prompt 失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
