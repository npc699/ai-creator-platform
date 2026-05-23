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

export const surfaceSoftMuted = "bg-brand-surface/80 text-brand-muted";

export const textSoftMuted = "text-brand-muted";

/** 软边框（搜索框、通知钮等） */
export const borderBrandSoft = "border-brand-border";

/** 主操作实心按钮（顶栏发布、存入素材库等） */
export const btnPrimary = [
  "inline-flex items-center justify-center rounded-xl",
  "bg-blue-400 text-sm font-medium text-white shadow-sm",
  "transition-colors hover:bg-blue-500",
].join(" ");

/** 主操作按钮禁用态：保持底色，避免 hover 变色 */
export const btnPrimaryDisabled =
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-400";
