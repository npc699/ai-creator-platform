"use client";

import type { ReactNode } from "react";

type AssistantTabPanelProps<T extends string> = {
  activeKey: T;
  renderPanel: (key: T) => ReactNode;
};

/** 右侧辅助栏 Tab 内容：随 activeKey 即时切换，无过渡动画。 */
export function AssistantTabPanel<T extends string>({
  activeKey,
  renderPanel,
}: AssistantTabPanelProps<T>) {
  return <>{renderPanel(activeKey)}</>;
}
