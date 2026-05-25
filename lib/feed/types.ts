/** Feed 卡片列表项，供首页 mock 与已发布真实数据共用同一套展示结构。 */
export type FeedArticleItem = {
  id: string;
  author: string;
  time: string;
  title: string;
  excerpt: string;
  /** 内容质量打分，后续由打分接口返回；当前占位数据写死 */
  score: number;
  /** 文章关键字标签 */
  tags?: string[];
  views: number;
  likes: number;
  href?: string;
  singleLineExcerpt?: boolean;
  /** 已发布列表专用：上线 / 下线状态标签 */
  publishStatus?: "online" | "offline";
  /** 为 true 时点赞走 API 持久化（已发布列表）；首页 mock 为 false */
  persistMetrics?: boolean;
  /** 当前登录用户是否已点赞，仅 persistMetrics 时有意义 */
  likedByViewer?: boolean;
  /** 是否允许点赞（需登录） */
  canLike?: boolean;
};

export type FeedScope = "home";
