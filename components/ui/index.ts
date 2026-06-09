// 通用 UI 基元：与业务域无关的可复用展示组件。

export { ContentPanel } from "./panel/content-panel";
export {
  SectionHeader,
  PanelSectionHeader,
  type SectionIconTone,
  type PanelSectionIconTone,
} from "./panel/section-header";

export {
  TabNav,
  TabNavFallback,
  PanelTabNav,
  PanelTabNavFallback,
  type TabNavOption,
  type PanelTabOption,
} from "./nav/tab-nav";

export { DialogShell, type DialogShellProps } from "./dialog/dialog-shell";
export { ConfirmDialog } from "./dialog/confirm-dialog";

export { EmptyState, type EmptyStateProps } from "./empty-state/empty-state";
