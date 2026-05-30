/**
 * 品牌样式 token。淡蓝背景统一为 bg-brand-surface（#EFF6FF）。
 */

/** 淡蓝背景（#EFF6FF），所有带底色的软按钮/卡片/选中态共用 */
export const bgBrandSurface = "bg-brand-surface";

/** 顶栏徽标（创 / 头像首字）：淡蓝底 + 强调蓝字 */
export const headerBadge = [
  bgBrandSurface,
  "text-brand-primary font-semibold",
].join(" ");

/** 软按钮：统一淡蓝底 + 深蓝字 */
export const btnSoft = [
  bgBrandSurface,
  "text-brand-on-surface transition-colors",
  "hover:bg-brand-surface hover:ring-1 hover:ring-inset hover:ring-brand-border",
].join(" ");

/** 选中态（Tab 等）：同色淡蓝底 + 强调蓝字 */
export const btnSoftActive = [
  bgBrandSurface,
  "text-brand-primary font-medium ring-1 ring-inset ring-brand-border",
].join(" ");

/** 内容区未选中 Tab */
export const navItemIdle =
  "text-brand-muted transition-colors hover:bg-brand-surface hover:text-brand-on-surface";

/** 左侧边栏：常态 */
export const navSidebarIdle = [
  "bg-transparent text-zinc-900",
  "transition-all duration-200 ease-out",
  "hover:bg-brand-surface hover:text-brand-primary hover:ring-1 hover:ring-inset hover:ring-brand-border",
].join(" ");

/** 左侧边栏：选中 */
export const navSidebarActive = [
  bgBrandSurface,
  "text-brand-primary ring-1 ring-inset ring-brand-border",
  "transition-all duration-200 ease-out",
].join(" ");

/** 标签、统计块等表面 */
export const surfaceSoft = [bgBrandSurface, "text-brand-on-surface"].join(" ");

/** @deprecated 请使用 getQualityScoreBadgeClass(score)，按档位返回配色。 */
export const badgeArticleScore = [
  "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
  "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
].join(" ");

/** 文章关键字标签徽章：灰色变体，与质量分同形态。 */
export const badgeArticleTag = [
  "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium",
  "bg-zinc-100 text-zinc-600 ring-1 ring-inset ring-zinc-200/80",
].join(" ");

export const surfaceSoftMuted = "bg-brand-surface/80 text-brand-muted";

export const textSoftMuted = "text-brand-muted";

/** 软边框（搜索框、通知钮等） */
export const borderBrandSoft = "border-brand-border";

/** 主 CTA（HomeSidebar 开始创作等）：蓝底白字 + hover 加深 */
export const btnCreateAction = [
  "inline-flex items-center justify-center gap-2 rounded-xl",
  "bg-blue-400 px-4 py-3 text-sm font-semibold text-white!",
  "transition hover:bg-blue-500 hover:text-white!",
].join(" ");

/** 编辑器顶栏文字按钮（返回、保存、预览等）：灰字 + 悬停灰底；链接需 ! 覆盖全局 a { color: inherit } */
export const btnEditorHeaderGhost = [
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-xl px-3",
  "text-sm font-medium text-zinc-600! transition",
  "hover:bg-zinc-100 hover:text-zinc-950!",
].join(" ");

export const btnEditorHeaderGhostDisabled =
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-zinc-600!";

/** 危险操作文字按钮（删除等）：常态红字，悬停淡红底 */
export const btnEditorHeaderGhostDanger = [
  "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-xl px-3",
  "text-sm font-medium text-red-700! transition",
  "hover:bg-red-50 hover:text-red-800!",
].join(" ");

export const btnEditorHeaderGhostDangerDisabled =
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-red-700!";

export const btnCreateActionDisabled =
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-400";

/** 主操作实心按钮（存入素材库等）；链接需 ! 覆盖全局 a { color: inherit } */
export const btnPrimary = [
  "inline-flex items-center justify-center rounded-xl",
  "bg-blue-400 text-sm font-medium text-white! shadow-sm",
  "transition-colors hover:bg-blue-500 hover:text-white!",
].join(" ");

/** 主操作按钮禁用态：保持底色，避免 hover 变色 */
export const btnPrimaryDisabled =
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-400";
