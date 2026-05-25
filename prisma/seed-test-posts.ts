import "dotenv/config";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import { PostStatus, PrismaClient } from "../lib/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置，无法生成测试文章");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

const ACCOUNTS_PATH = path.join(
  process.cwd(),
  "local",
  "test-accounts",
  "accounts.json"
);

type SeedPost = {
  title: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  daysAgo: number;
  paragraphs: string[];
};

type AccountSeed = {
  label: string;
  userId: string;
  posts: SeedPost[];
};

function toHtml(paragraphs: string[]) {
  return paragraphs.map((text) => `<p>${text}</p>`).join("");
}

function publishedAtFromDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(10 + (daysAgo % 8), 30, 0, 0);
  return date;
}

/** 五账号各约 10 篇已发布文章（合计约 50 篇），标题固定便于重复执行时覆盖更新。 */
const ACCOUNT_SEEDS: AccountSeed[] = [
  {
    label: "创作者 A",
    userId: "cmpk06j4500003c9zvylwfyim",
    posts: [
      {
        title: "2026 年 AI 写作工具横评：从效率到质量的 5 个维度",
        tags: ["AI工具", "内容创作"],
        viewCount: 12400,
        likeCount: 834,
        daysAgo: 1,
        paragraphs: [
          "过去半年我们测试了 12 款主流 AI 写作产品，从生成速度、可控性、事实准确率和排版体验四个维度给出结论。",
          "对于日更型公众号，优先考虑支持大纲锁定与分段改写的工具；品牌方则更看重风格一致性与团队协作能力。",
          "文末附上了可直接套用的测评表格模板，方便你在团队内复用。",
        ],
      },
      {
        title: "用 Claude 写长文时的 7 个 Prompt 技巧",
        tags: ["Prompt", "长文写作"],
        viewCount: 6800,
        likeCount: 412,
        daysAgo: 3,
        paragraphs: [
          "长文最容易出现的问题是结构发散和观点重复。我们在实践中把写作拆成「选题确认—大纲—分段扩写—统一润色」四步。",
          "每一步只给模型单一任务，并在 Prompt 里明确禁止编造数据，能显著降低返工率。",
        ],
      },
      {
        title: "创作者如何建立可复用的 AI 工作流",
        tags: ["工作流", "效率"],
        viewCount: 9200,
        likeCount: 556,
        daysAgo: 5,
        paragraphs: [
          "工作流的核心不是工具数量，而是输入输出是否标准化。建议为常见栏目准备固定 Prompt 库与检查清单。",
          "每周复盘一次高互动稿件，把有效指令沉淀进 Prompt 库，比盲目追新模型更划算。",
        ],
      },
      {
        title: "AI 辅助排版：从 Markdown 到公众号一键发布",
        tags: ["排版", "公众号"],
        viewCount: 4100,
        likeCount: 198,
        daysAgo: 8,
        paragraphs: [
          "排版耗时往往被低估。我们对比了三种导出链路，最终保留了「编辑器预览 + 手动微调标题间距」的方案。",
          "图片说明、引用块和分割线要在源稿里就用语义化标记写好，后期改动成本会低很多。",
        ],
      },
      {
        title: "DeepSeek 与 GPT 在中文长文场景下的对比笔记",
        tags: ["AI工具", "长文写作"],
        viewCount: 7600,
        likeCount: 445,
        daysAgo: 11,
        paragraphs: [
          "同一提纲下我们各生成 3000 字，对比事实错误率、口语化程度和结尾号召力。",
          "中文语料更丰富的模型在案例引用上更稳，但仍需人工核对年份与数据来源。",
        ],
      },
      {
        title: "知识博主如何用 AI 做选题而不是代写全文",
        tags: ["内容创作", "选题"],
        viewCount: 5400,
        likeCount: 312,
        daysAgo: 13,
        paragraphs: [
          "把 AI 放在「发散—收敛」阶段，正文保留个人经历与判断，读者信任度更高。",
          "每周固定一次选题会，用模型列出 20 个角度再人工筛到 3 个可写方向。",
        ],
      },
      {
        title: "Notion + AI：搭建个人 Prompt 库的 4 个字段",
        tags: ["Prompt", "工作流"],
        viewCount: 3900,
        likeCount: 201,
        daysAgo: 15,
        paragraphs: [
          "建议字段包含：场景、输入示例、期望输出、失败案例。便于团队检索与迭代。",
          "版本号写在标题后缀，避免同事误用已废弃指令。",
        ],
      },
      {
        title: "日更 30 天后掉粉？可能是结构而不是产量问题",
        tags: ["运营", "公众号"],
        viewCount: 6100,
        likeCount: 358,
        daysAgo: 17,
        paragraphs: [
          "连续日更若缺少栏目区分，读者会摸不清账号价值。建议「固定栏目 + 灵活加餐」。",
          "用数据回看取消关注高峰日的稿件类型，及时调整比例。",
        ],
      },
      {
        title: "AI 生成配图合规清单：版权与平台规则",
        tags: ["AI工具", "排版"],
        viewCount: 4500,
        likeCount: 176,
        daysAgo: 19,
        paragraphs: [
          "商用前确认模型服务条款是否允许广告场景，并保留生成记录以备申诉。",
          "人物写实风格要格外谨慎，优先使用插画或抽象视觉降低风险。",
        ],
      },
      {
        title: "从 0 搭建写作 SOP：新人 7 天可上手版",
        tags: ["工作流", "效率"],
        viewCount: 8200,
        likeCount: 490,
        daysAgo: 21,
        paragraphs: [
          "SOP 包含选题来源、素材归档、审稿清单和发布复盘四块，每天只练一块。",
          "第七天做模拟发布，由老同事按检查表打分，合格后再接真实稿件。",
        ],
      },
    ],
  },
  {
    label: "创作者 B",
    userId: "cmpk06jat00013c9zt19u7ztb",
    posts: [
      {
        title: "短视频脚本 3 段式结构：开头 3 秒决定完播率",
        tags: ["短视频", "脚本"],
        viewCount: 9800,
        likeCount: 612,
        daysAgo: 2,
        paragraphs: [
          "基于 200 条爆款样本，「痛点—反转—行动」结构在知识类账号里完播率最高，平均提升约 18%。",
          "开头避免空泛提问，直接展示结果画面或对比镜头，更容易留住划走的用户。",
        ],
      },
      {
        title: "小红书种草笔记：标题 21 种可套用公式",
        tags: ["小红书", "种草"],
        viewCount: 15100,
        likeCount: 1100,
        daysAgo: 4,
        paragraphs: [
          "数字型、悬念型和对比型标题在美妆、家居两个赛道表现稳定。我们整理了 21 种公式并标注适用场景。",
          "注意同一账号不要连续三篇都用悬念型，读者会产生审美疲劳，互动率会下滑。",
        ],
      },
      {
        title: "直播切片再创作：一条直播如何产出 8 条短视频",
        tags: ["直播", "切片"],
        viewCount: 7200,
        likeCount: 388,
        daysAgo: 6,
        paragraphs: [
          "切片前先在直播回放里标记「金句时间戳」和「产品演示段」，再按平台时长要求裁剪。",
          "每条切片只保留一个核心观点，字幕与封面标题保持一致，有助于提升推荐一致性。",
        ],
      },
      {
        title: "抖音本地生活账号冷启动 30 天复盘",
        tags: ["本地生活", "运营"],
        viewCount: 5300,
        likeCount: 245,
        daysAgo: 10,
        paragraphs: [
          "冷启动阶段不要追求爆款，先把「门店定位—优惠钩子—到店指引」说清。前 30 天以 POI 点击率为核心指标。",
          "配合 3 条探店实拍 + 2 条老板口播，比纯图文更容易获得本地流量池推荐。",
        ],
      },
      {
        title: "口播稿节奏：每 15 秒一个信息点怎么练",
        tags: ["短视频", "脚本"],
        viewCount: 6400,
        likeCount: 370,
        daysAgo: 12,
        paragraphs: [
          "口播不是念稿，而是「停顿—重音—手势」配合信息点。建议用手机前置录 3 遍选最自然的一版。",
          "数字与对比句要放慢半拍，方便观众截图记忆。",
        ],
      },
      {
        title: "B 站知识区封面：3 种高点击布局",
        tags: ["内容创作", "短视频"],
        viewCount: 4800,
        likeCount: 255,
        daysAgo: 14,
        paragraphs: [
          "人脸 + 大字标题 + 单一色块背景在知识区依然有效，但要控制字数在 8 字以内。",
          "避免封面与标题完全重复，留出好奇心缺口。",
        ],
      },
      {
        title: "带货短视频：前 5 秒必须出现的 2 个元素",
        tags: ["种草", "短视频"],
        viewCount: 10200,
        likeCount: 680,
        daysAgo: 16,
        paragraphs: [
          "「使用场景 + 价格锚点」同时出现，转化明显高于纯开箱。",
          "评论区置顶购买说明，减少私信重复回答。",
        ],
      },
      {
        title: "一条 vlog 拆 6 条竖屏：剪辑时间轴模板",
        tags: ["切片", "工作流"],
        viewCount: 3700,
        likeCount: 168,
        daysAgo: 18,
        paragraphs: [
          "按「冲突—过程—结果」标记时间轴，每条竖屏只保留 20–40 秒高潮段。",
          "统一导出 9:16 与字幕样式，品牌感会更连贯。",
        ],
      },
      {
        title: "同城探店账号：POI 名称怎么写更容易被搜到",
        tags: ["本地生活", "运营"],
        viewCount: 2900,
        likeCount: 121,
        daysAgo: 20,
        paragraphs: [
          "标题里写清商圈 + 品类 + 人均，比夸张形容词更有搜索价值。",
          "营业时间变动要在简介区同步，减少差评。",
        ],
      },
      {
        title: "直播预告短视频：转化到场的 3 句文案",
        tags: ["直播", "脚本"],
        viewCount: 5600,
        likeCount: 302,
        daysAgo: 22,
        paragraphs: [
          "明确开播时间、本场福利和适合人群，三句缺一不可。",
          "结尾用「预约+评论关键词」双 CTA，方便平台统计兴趣。",
        ],
      },
    ],
  },
  {
    label: "创作者 C",
    userId: "cmpk06jgx00023c9zgmlbvpxl",
    posts: [
      {
        title: "公众号标题 A/B 测试：点击率提升 37% 的实测",
        tags: ["公众号", "标题"],
        viewCount: 11200,
        likeCount: 720,
        daysAgo: 1,
        paragraphs: [
          "同一篇文章我们测试了 4 组标题，差异主要在数字、情绪词和利益点是否前置。",
          "带具体数字且不超过 22 字的标题，打开率明显更高；过度夸张的情绪词反而会提高取关率。",
        ],
      },
      {
        title: "周报型栏目如何降低写作压力",
        tags: ["栏目策划", "周报"],
        viewCount: 3600,
        likeCount: 156,
        daysAgo: 4,
        paragraphs: [
          "周报最怕变成流水账。固定「本周一条洞察 + 两条证据 + 一条行动建议」结构，读者预期会更清晰。",
          "素材收集可以放在周四下午，周五上午只做编排和润色，能稳定交付质量。",
        ],
      },
      {
        title: "节日营销选题日历（2026 下半年版）",
        tags: ["选题", "营销"],
        viewCount: 8900,
        likeCount: 498,
        daysAgo: 7,
        paragraphs: [
          "我们把 9–12 月的重要营销节点按「预热—爆发—返场」拆成可执行的选题表，并标注内容形式建议。",
          "提前两周储备案例稿和模板稿，节日当周只做轻量改编，团队不容易熬夜赶稿。",
        ],
      },
      {
        title: "粉丝留言回复话术库：提高互动又不显得机械",
        tags: ["互动", "私域"],
        viewCount: 2800,
        likeCount: 132,
        daysAgo: 12,
        paragraphs: [
          "高频问题建议分类维护标准回复，再留 20% 空间做个性化补充，既节省人力也保持温度。",
          "避免在评论区做硬广跳转，用「置顶评论放链接」的方式更符合平台规则。",
        ],
      },
      {
        title: "订阅号改版后：菜单栏还能怎么导流",
        tags: ["公众号", "运营"],
        viewCount: 5100,
        likeCount: 288,
        daysAgo: 13,
        paragraphs: [
          "菜单适合放「精选合集」而不是单篇，减少读者选择成本。",
          "每周更新一次菜单文案，与当周主推栏目保持一致。",
        ],
      },
      {
        title: "10 万粉账号的选题会怎么开（30 分钟版）",
        tags: ["选题", "栏目策划"],
        viewCount: 7400,
        likeCount: 401,
        daysAgo: 15,
        paragraphs: [
          "先过数据：上周阅读完成率、分享率、在看率各 Top3，再决定本周复制哪类结构。",
          "争议题要配事实核查人，避免法务风险。",
        ],
      },
      {
        title: "文末引导关注：哪种话术最不讨嫌",
        tags: ["互动", "公众号"],
        viewCount: 3300,
        likeCount: 149,
        daysAgo: 18,
        paragraphs: [
          "用「下篇预告」替代「请关注」，读者更愿意留存。",
          "福利型引导要真的兑现，一次失信会长期伤打开率。",
        ],
      },
      {
        title: "合集功能实操：把旧文二次分发",
        tags: ["公众号", "内容创作"],
        viewCount: 4600,
        likeCount: 233,
        daysAgo: 20,
        paragraphs: [
          "按主题而不是时间做合集，新读者可以从合集入口读完一个系列。",
          "合集封面与导语要写清适合谁读，提升点击。",
        ],
      },
      {
        title: "私域引流合规：公众号到企微的路径设计",
        tags: ["私域", "运营"],
        viewCount: 3900,
        likeCount: 187,
        daysAgo: 23,
        paragraphs: [
          "避免诱导分享，改用「资料包领取」等明确价值交换。",
          "欢迎语里说明更新频率，降低添加后立即删除率。",
        ],
      },
      {
        title: "标题里要不要放 emoji：我们测了 200 篇",
        tags: ["标题", "公众号"],
        viewCount: 6800,
        likeCount: 395,
        daysAgo: 25,
        paragraphs: [
          "知识类账号放 1 个相关 emoji 打开率略升，放 3 个以上会显著下降。",
          "情绪类账号相反，适度 emoji 有助于传达语气。",
        ],
      },
    ],
  },
  {
    label: "创作者 D",
    userId: "cmpk06jmy00033c9z1aih8pof",
    posts: [
      {
        title: "无线降噪耳机选购指南：500 到 2000 元怎么选",
        tags: ["产品测评", "数码"],
        viewCount: 18600,
        likeCount: 1240,
        daysAgo: 2,
        paragraphs: [
          "我们测试了 8 款主流降噪耳机，重点对比通勤场景下的降噪深度、佩戴舒适度和多设备切换体验。",
          "预算在千元档的用户可以优先看通透模式与通话质量，运动场景则要看防汗等级和佩戴稳固性。",
        ],
      },
      {
        title: "扫地机器人避坑：别被「吸力参数」带偏",
        tags: ["家电", "避坑"],
        viewCount: 9400,
        likeCount: 520,
        daysAgo: 5,
        paragraphs: [
          "真实体验里，路线规划、避障和基站自清洁对满意度的影响远大于吸力纸面参数。",
          "有长发家庭成员的建议优先看滚刷防缠绕设计，养宠家庭重点考察集尘袋异味控制。",
        ],
      },
      {
        title: "618 预售规则解读：什么时候下单最划算",
        tags: ["电商", "促销"],
        viewCount: 6700,
        likeCount: 301,
        daysAgo: 9,
        paragraphs: [
          "预售并不等于最低价。我们梳理了平台满减叠加顺序、价保规则和退换货限制，避免踩坑。",
          "大件家电建议对比「预售赠品」和「现货直降」的总到手价，有时现货反而更便宜。",
        ],
      },
      {
        title: "轻薄本 2026：办公与剪片双场景实测",
        tags: ["产品测评", "数码"],
        viewCount: 12800,
        likeCount: 702,
        daysAgo: 7,
        paragraphs: [
          "核显本也能剪 1080p VLOG，关键是内存与散热；16G 内存在多轨时间线会明显卡顿。",
          "续航测试统一 150 尼特亮度，避免厂商宣传值误导读者。",
        ],
      },
      {
        title: "空气炸锅是不是智商税？家庭使用 30 天记录",
        tags: ["家电", "避坑"],
        viewCount: 14200,
        likeCount: 890,
        daysAgo: 11,
        paragraphs: [
          "对常吃冷冻半成品的人值回票价；习惯现炒现吃的家庭使用频率会偏低。",
          "清洗成本常被忽略，选购要看炸篮是否可整机进洗碗机。",
        ],
      },
      {
        title: "显示器色准对修图有多重要：入门到进阶",
        tags: ["数码", "产品测评"],
        viewCount: 5900,
        likeCount: 310,
        daysAgo: 13,
        paragraphs: [
          "sRGB 覆盖率比分辨率更影响入门修图体验，建议优先校色再谈 4K。",
          "双屏用户注意色温一致，否则导出后色差会抓狂。",
        ],
      },
      {
        title: "洗地机 vs 扫地机：三口之家怎么选",
        tags: ["家电", "产品测评"],
        viewCount: 8700,
        likeCount: 455,
        daysAgo: 16,
        paragraphs: [
          "有娃家庭汤汁污渍多，洗地机即时清洁更实用；独居可优先考虑扫地机自动化。",
          "污水箱异味是差评高发点，要选带热风烘干或自清洁基站的产品。",
        ],
      },
      {
        title: "机械键盘轴体选择：码字与游戏能否兼得",
        tags: ["数码", "种草"],
        viewCount: 10100,
        likeCount: 620,
        daysAgo: 19,
        paragraphs: [
          "线性轴适合游戏，段落轴更适合打字反馈；静音轴是办公室共用首选。",
          "键帽材质比轴体更影响手感持久度，PBT 更耐油。",
        ],
      },
      {
        title: "双十一凑单攻略：家电类目满减怎么叠",
        tags: ["电商", "促销"],
        viewCount: 11300,
        likeCount: 540,
        daysAgo: 24,
        paragraphs: [
          "先锁刚需大件，再用小件凑满门槛；不要为了凑单买用不到的耗材。",
          "店铺券与平台券叠加顺序不同，到手价能差几十到几百。",
        ],
      },
      {
        title: "投影仪白天能看吗？亮度参数解读",
        tags: ["家电", "避坑"],
        viewCount: 7200,
        likeCount: 338,
        daysAgo: 26,
        paragraphs: [
          "ANSI 流明低于 1000 基本只能夜间使用；有娃家庭更要关注护眼模式与安装距离。",
          "幕布增益比机身亮度更影响观感，预算要一起规划。",
        ],
      },
    ],
  },
  {
    label: "创作者 E",
    userId: "cmpk06jt300043c9zw3gzz26y",
    posts: [
      {
        title: "SaaS 内容营销季度规划：从线索到转化的闭环",
        tags: ["B2B", "内容营销"],
        viewCount: 4200,
        likeCount: 188,
        daysAgo: 3,
        paragraphs: [
          "B2B 内容要避免只写产品功能。我们按买家旅程拆成认知、评估和决策三阶段，每阶段匹配不同内容类型。",
          "案例稿要突出「前状态—实施过程—可量化结果」，比功能清单更容易获得销售线索。",
        ],
      },
      {
        title: "制造业数字化转型：三个可落地的内容切入点",
        tags: ["行业分析", "制造"],
        viewCount: 3100,
        likeCount: 142,
        daysAgo: 6,
        paragraphs: [
          "对工厂客户而言，最关心的是良率、能耗和交付周期。内容选题应围绕这三类 KPI 展开，而不是泛泛谈 AI。",
          "建议用现场访谈 + 数据图表的形式，增强可信度；纯观点文章很难打动采购决策链。",
        ],
      },
      {
        title: "ToB 官网博客 SEO：技术类文章如何排进前三页",
        tags: ["SEO", "官网"],
        viewCount: 5800,
        likeCount: 267,
        daysAgo: 11,
        paragraphs: [
          "技术博客的关键词选择要避开超大流量词，优先长尾问题词，例如「某某系统如何对接 ERP」。",
          "内链结构比单篇爆款更重要：把解决方案、案例和功能页串成主题集群，权重积累更稳定。",
        ],
      },
      {
        title: "季度行业简报撰写模板（含数据来源说明）",
        tags: ["简报", "模板"],
        viewCount: 2400,
        likeCount: 98,
        daysAgo: 14,
        paragraphs: [
          "简报类内容的价值在于可引用性。每个结论都要标注数据来源与统计口径，方便读者二次传播。",
          "附录提供 Excel 模板和图表配色规范，品牌团队可以据此统一对外物料风格。",
        ],
      },
      {
        title: "客户案例页怎么写：销售最爱转发的结构",
        tags: ["B2B", "内容营销"],
        viewCount: 3600,
        likeCount: 165,
        daysAgo: 8,
        paragraphs: [
          "案例页顺序建议：客户背景—挑战—方案—量化结果—客户原话，避免写成产品说明书。",
          "数字要可验证，销售转发时才敢用。",
        ],
      },
      {
        title: "白皮书下载转化低？可能是落地页太长",
        tags: ["官网", "SEO"],
        viewCount: 4100,
        likeCount: 192,
        daysAgo: 10,
        paragraphs: [
          "首屏只回答「适合谁、解决什么、填写后得到什么」，详细目录放到折叠区。",
          "表单字段超过 4 个会明显掉转化，能延后收集就不要首屏全要。",
        ],
      },
      {
        title: "工业安全内容如何做 E-E-A-T",
        tags: ["行业分析", "制造"],
        viewCount: 2800,
        likeCount: 118,
        daysAgo: 12,
        paragraphs: [
          "作者栏写清职务与现场经验，配图优先实拍而非素材库。",
          "引用国标或行业规范编号，方便采购与技术同时审阅。",
        ],
      },
      {
        title: "Webinar 复盘稿：一场直播如何拆 5 篇公众号",
        tags: ["内容营销", "栏目策划"],
        viewCount: 5200,
        likeCount: 244,
        daysAgo: 15,
        paragraphs: [
          "按「观点金句—问答—演示截图—资料下载—报名回顾」拆稿，一周发完不浪费素材。",
          "每篇末尾链回同一资料包，形成内链集群。",
        ],
      },
      {
        title: "竞品对比文章：法务与 SEO 都要过的写法",
        tags: ["SEO", "B2B"],
        viewCount: 3400,
        likeCount: 151,
        daysAgo: 18,
        paragraphs: [
          "对比维度要可量化，避免主观贬损词汇；数据注明测试时间与版本。",
          "结构化表格利于抓取 featured snippet。",
        ],
      },
      {
        title: "销售线索评分：内容团队该关注哪些指标",
        tags: ["B2B", "运营"],
        viewCount: 4700,
        likeCount: 221,
        daysAgo: 22,
        paragraphs: [
          "不要只看下载量，要看 MQL 占比、跟进速度与成交周期变化。",
          "高价值线索常来自深度案例而非泛行业科普。",
        ],
      },
    ],
  },
];

async function resolveAccountSeeds(): Promise<AccountSeed[]> {
  try {
    const raw = await readFile(ACCOUNTS_PATH, "utf8");
    const parsed = JSON.parse(raw) as {
      accounts: { label: string; userId: string }[];
    };

    const idByLabel = new Map(
      parsed.accounts.map((account) => [account.label, account.userId])
    );

    return ACCOUNT_SEEDS.map((seed) => {
      const userId = idByLabel.get(seed.label) ?? seed.userId;
      return { ...seed, userId };
    });
  } catch {
    console.warn(
      "未读取到 local/test-accounts/accounts.json，使用脚本内嵌 userId。"
    );
    return ACCOUNT_SEEDS;
  }
}

async function main() {
  const seeds = await resolveAccountSeeds();
  const allTitles = seeds.flatMap((account) =>
    account.posts.map((post) => post.title)
  );
  const userIds = seeds.map((account) => account.userId);

  const deleted = await prisma.post.deleteMany({
    where: {
      userId: { in: userIds },
      title: { in: allTitles },
    },
  });

  let created = 0;

  for (const account of seeds) {
    const user = await prisma.user.findUnique({
      where: { id: account.userId },
      select: { id: true, name: true },
    });

    if (!user) {
      console.warn(`跳过 ${account.label}：用户 ${account.userId} 不存在`);
      continue;
    }

    for (const post of account.posts) {
      await prisma.post.create({
        data: {
          userId: user.id,
          title: post.title,
          content: toHtml(post.paragraphs),
          status: PostStatus.PUBLISHED,
          publishedAt: publishedAtFromDaysAgo(post.daysAgo),
          viewCount: post.viewCount,
          likeCount: post.likeCount,
          tags: post.tags,
        },
      });
      created += 1;
      console.log(`  ✓ [${account.label}] ${post.title}`);
    }
  }

  console.log("\n测试文章生成完成：");
  console.log(`  删除旧稿（同标题）: ${deleted.count} 篇`);
  console.log(`  新建已发布文章: ${created} 篇`);
  console.log(`  账号数: ${seeds.length}`);
  console.log("\n说明：可在首页 Feed（无限滚动）与各账号【已发布】、文章详情页验证。");
}

main()
  .catch((error) => {
    console.error("seed-test-posts 执行失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
