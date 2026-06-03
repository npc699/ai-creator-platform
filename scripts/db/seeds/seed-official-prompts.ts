// 可选种子：向管理员账号写入全站「官方」Prompt 模板（isOfficial=true），全员可见、不可删改归属。
// 运行：npm run db:seed:official-prompts；须先 db:seed。库内已有任意官方 Prompt 则整批跳过。
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type PromptCategory } from "../../../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置，无法写入官方 Prompt");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

type OfficialPromptSeed = {
  title: string;
  content: string;
  category: PromptCategory;
  usageCount?: number;
};

const OFFICIAL_PROMPTS: OfficialPromptSeed[] = [
  // 长文写作
  {
    category: "LONG_FORM",
    title: "深度干货长文框架",
    content: `请撰写一篇 1500 字以上的深度长文：
1. 用真实场景引出读者痛点
2. 拆解问题背后的 3 个关键原因
3. 给出分步骤解决方案
4. 补充 1 个案例与反例对比
5. 结尾提供可执行清单
语气专业、结构清晰，适合公众号发布。`,
    usageCount: 42,
  },
  {
    category: "LONG_FORM",
    title: "人物故事型长文",
    content: `以第三人称视角写一篇人物故事长文：
- 设定主角身份与初始困境
- 描述一次关键转折事件
- 展示行动过程与内心变化
- 提炼 3 条可复用经验
全文 1200-1800 字，注重细节与节奏。`,
    usageCount: 28,
  },
  {
    category: "LONG_FORM",
    title: "行业白皮书摘要",
    content: `围绕指定行业输出白皮书式长文摘要：
## 行业现状（数据+趋势）
## 核心挑战（3 点）
## 未来 12 个月预测
## 对企业的 3 条策略建议
## 对个人的 2 条行动建议
要求逻辑严谨，避免空泛口号。`,
    usageCount: 19,
  },
  {
    category: "LONG_FORM",
    title: "观点辩论型长文",
    content: `针对争议话题撰写辩论型长文：
1. 明确正方核心观点
2. 列出 3 条支持论据
3. 公正呈现 2 个反方观点并回应
4. 给出折中或升级后的结论
适合知乎/专栏，1000-1500 字。`,
  },

  // 短图文
  {
    category: "SHORT_POST",
    title: "三行金句短图文",
    content: `输出一条适合小红书的短图文：
- 第 1 行：反常识观点或提问
- 第 2 行：解释原因或方法
- 第 3 行：行动号召
总字数 80-120，口语化，有节奏感。`,
    usageCount: 56,
  },
  {
    category: "SHORT_POST",
    title: "数字清单短图文",
    content: `写一篇「N 个技巧」短图文：
- 标题含具体数字
- 每条技巧 1 句话，不超过 18 字
- 最后 1 句总结
150-200 字，适合朋友圈/小红书。`,
    usageCount: 33,
  },
  {
    category: "SHORT_POST",
    title: "热点速评模板",
    content: `针对热点事件写 100 字速评：
1. 30 字内亮明立场
2. 50 字说明依据
3. 20 字互动提问
保持克制，避免标题党。`,
    usageCount: 21,
  },

  // 种草内容
  {
    category: "SEEDING",
    title: "场景代入种草",
    content: `为指定产品写场景种草文案：
- 开头 2 句话描述具体使用场景
- 中间写 3 个真实体验细节
- 结尾自然推荐，避免硬广
300-400 字，像朋友分享。`,
    usageCount: 47,
  },
  {
    category: "SEEDING",
    title: "对比体验种草",
    content: `用 Before/After 结构写种草笔记：
Before：没用之前的具体困扰
After：使用后的可感知变化
Why：为什么选这款产品（2 点）
200-300 字，可加 2 个 emoji。`,
    usageCount: 38,
  },
  {
    category: "SEEDING",
    title: "清单式种草",
    content: `围绕「{场景}必备」写清单种草：
- 推荐 3-5 个产品/工具
- 每个 1 句话说明推荐理由
- 按优先级排序
- 指出「最值得买的一个」`,
    usageCount: 25,
  },
  {
    category: "SEEDING",
    title: "开箱第一印象",
    content: `模拟开箱写种草内容：
1. 包装/外观第一印象
2. 上手 3 个亮点
3. 1 个小缺点（增加可信度）
4. 适合谁 / 不适合谁
语言真实，避免夸张形容词。`,
  },

  // 产品测评
  {
    category: "PRODUCT_REVIEW",
    title: "标准测评报告",
    content: `撰写客观产品测评：
## 产品概述
## 优点（3 条，有依据）
## 缺点（2 条，不回避）
## 适合 / 不适合人群
## 综合评分（/10）+ 一句话结论
保持中立，拒绝软文腔。`,
    usageCount: 31,
  },
  {
    category: "PRODUCT_REVIEW",
    title: "性价比测评",
    content: `从性价比角度测评产品：
- 同价位 2-3 个竞品对比
- 核心差异与取舍
- 不同预算下的购买建议
800 字左右，结论明确。`,
    usageCount: 22,
  },
  {
    category: "PRODUCT_REVIEW",
    title: "多产品横评",
    content: `对同品类 3 款产品横向对比：
从性能、价格、体验、售后四个维度打分（1-5）
用表格呈现，并给出不同需求下的推荐。`,
    usageCount: 15,
  },

  // 行业分析
  {
    category: "INDUSTRY",
    title: "行业趋势速览",
    content: `输出行业趋势分析短文：
1. 判断行业所处阶段
2. 列出 3 个关键驱动因素
3. 提示 2 个潜在风险
4. 给从业者 3 条建议
800-1200 字，引用公开信息需标注来源。`,
    usageCount: 18,
  },
  {
    category: "INDUSTRY",
    title: "竞争格局分析",
    content: `分析目标行业竞争格局：
- 头部玩家及差异化
- 新进入者威胁
- 未来 1-2 年格局演变预测
结构清晰，适合内部汇报。`,
    usageCount: 12,
  },
  {
    category: "INDUSTRY",
    title: "用户洞察报告",
    content: `基于行业/产品输出用户洞察：
- 2-3 类用户画像
- 每类核心诉求与决策路径
- 3 个内容/产品切入机会
600-900 字，论据充分。`,
    usageCount: 9,
  },

  // 标题生成
  {
    category: "TITLE_GEN",
    title: "多风格标题生成",
    content: `根据正文摘要生成 10 个标题：
- 3 个数字型
- 3 个悬念型
- 2 个痛点型
- 2 个利益型
每个 15-25 字，标注适用平台。`,
    usageCount: 64,
  },
  {
    category: "TITLE_GEN",
    title: "悬念标题公式",
    content: `为主题生成 5 个悬念标题：
- 不标题党、不夸大
- 每个附 1 句说明「悬念点在哪」
- 15-22 字为主`,
    usageCount: 41,
  },
  {
    category: "TITLE_GEN",
    title: "小红书标题包",
    content: `生成 8 个小红书风格标题：
- 含 1-2 个 relevant emoji
- 15-20 字
- 覆盖教程/避坑/清单/对比四种类型`,
    usageCount: 37,
  },
  {
    category: "TITLE_GEN",
    title: "A/B 标题对比",
    content: `为同一文章生成 A/B 两组标题各 3 个：
A 组：理性专业向
B 组：情绪共鸣向
并说明各组适合受众与渠道。`,
  },

  // 改写润色
  {
    category: "REWRITE",
    title: "口语化改写",
    content: `将原文改写为口语化风格：
- 像跟朋友聊天
- 句子短、去官话
- 保留核心信息
字数控制在原文 90%-110%。`,
    usageCount: 52,
  },
  {
    category: "REWRITE",
    title: "商务专业润色",
    content: `将原文润色为商务专业风格：
- 用词准确、逻辑清晰
- 去掉口语和重复
- 适合发给客户或上级`,
    usageCount: 29,
  },
  {
    category: "REWRITE",
    title: "精简压缩",
    content: `将原文压缩至 50% 字数以内：
- 不丢关键论点与数据
- 删修饰语和重复表达
- 保持可读性`,
    usageCount: 24,
  },
  {
    category: "REWRITE",
    title: "大纲扩写",
    content: `将大纲扩写为完整段落：
- 每个要点 80-120 字
- 补充例子与场景描写
- 段落之间过渡自然`,
    usageCount: 16,
  },
];

async function main() {
  const adminEmail = (process.env.DEV_ADMIN_EMAIL ?? "admin@localhost").toLowerCase();

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, email: true },
  });

  if (!admin) {
    throw new Error("未找到管理员账号，请先运行 npx prisma db seed");
  }

  const existing = await prisma.prompt.count({
    where: { isOfficial: true },
  });

  if (existing > 0) {
    console.log(`已有 ${existing} 条官方 Prompt，跳过重复写入。`);
    return;
  }

  const created = await prisma.prompt.createMany({
    data: OFFICIAL_PROMPTS.map((prompt) => ({
      userId: admin.id,
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
      isOfficial: true,
      usageCount: prompt.usageCount ?? 0,
    })),
  });

  const byCategory = OFFICIAL_PROMPTS.reduce<Record<string, number>>((acc, prompt) => {
    acc[prompt.category] = (acc[prompt.category] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`已写入 ${created.count} 条官方 Prompt：`);
  for (const [category, count] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${count} 条`);
  }
}

main()
  .catch((error) => {
    console.error("写入官方 Prompt 失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
