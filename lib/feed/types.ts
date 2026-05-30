/** Feed 卡片列表项，供首页 mock 与已发布真实数据共用同一套展示结构。 */
export type FeedArticleItem = {
  id: string;
  author: string;
  authorId: string;
  authorImage?: string | null;
  time: string;
  title: string;
  excerpt: string;
  /** 内容质量打分，null 表示尚未评分（待审核或草稿） */
  score: number | null;
  /** 审核未完成标记，仅作者视角使用 */
  reviewPending?: boolean;
  /** 文章关键字标签 */
  tags?: string[];
  views: number;
  likes: number;
  href?: string;
  /** 已发布列表专用：上线 / 下线状态标签 */
  publishStatus?: "online" | "offline";
  /** 为 true 时点赞走 API 持久化（已发布列表）；首页 mock 为 false */
  persistMetrics?: boolean;
  /** 当前登录用户是否已点赞，仅 persistMetrics 时有意义 */
  likedByViewer?: boolean;
  /** 是否允许点赞（需登录） */
  canLike?: boolean;
  /** 列表封面图 URL（用户于编辑器单独设置） */
  coverUrl?: string | null;
  /** 热点榜全局排名（从 1 起） */
  rank?: number;
  /** 热点榜：发布 48h 内且排名前 10 */
  isRisingFast?: boolean;
  /** 爆文榜：持续热门天数，≥2 时展示 */
  sustainedHotDays?: number | null;
};

export type FeedScope = "home";
