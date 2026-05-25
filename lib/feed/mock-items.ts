import type { FeedArticleItem } from "@/lib/feed/types";

const baseFeedItems: FeedArticleItem[] = [
  {
    id: "1",
    author: "科技观察员",
    time: "2 小时前",
    title: "2026 年 AI 写作工具横评：从效率到质量的 5 个维度",
    excerpt:
      "我们测试了 12 款主流 AI 写作产品，从生成速度、可控性、事实准确率和排版体验四个维度给出结论……",
    score: 92,
    views: 12_400,
    likes: 834,
  },
  {
    id: "2",
    author: "运营研究社",
    time: "4 小时前",
    title: "短视频脚本 3 段式结构：开头 3 秒决定完播率",
    excerpt:
      "结合 200 条爆款样本，我们总结出「痛点 - 反转 - 行动」结构，并给出可直接套用的模板……",
    score: 88,
    views: 9_800,
    likes: 612,
  },
  {
    id: "3",
    author: "内容增长笔记",
    time: "昨天",
    title: "公众号标题 21 种公式：点击率提升 37% 的实测",
    excerpt:
      "通过 A/B 测试对比数字型、悬念型、对比型标题，整理出适合不同赛道的标题写法与避坑清单……",
    score: 90,
    views: 15_100,
    likes: 1_100,
  },
];

/** 首页滚动布局测试数据，联调完成后由 channel + sort 驱动接口请求。 */
export const mockHomeFeedItems: FeedArticleItem[] = [
  ...baseFeedItems,
  ...Array.from({ length: 15 }, (_, index) => {
    const template = baseFeedItems[index % baseFeedItems.length]!;
    const seq = index + 4;

    return {
      ...template,
      id: `scroll-mock-${seq}`,
      time: `${seq} 小时前`,
      title: `[滚动测试 #${seq}] ${template.title}`,
      score: Math.min(99, (template.score ?? 85) + (seq % 5)),
      views: Math.round(seq * 1_300),
      likes: seq * 127,
    };
  }),
];
