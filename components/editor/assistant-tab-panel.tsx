"use client";

import type { ReactNode } from "react";

type AssistantTabPanelProps = {
  activeKey: string;
  renderPanel: (key: string) => ReactNode;
};

/** 右侧辅助区 Tab 内容：随 activeKey 即时切换，无过渡动画。 */
export function AssistantTabPanel({ activeKey, renderPanel }: AssistantTabPanelProps) {
  return <>{renderPanel(activeKey)}</>;
}
