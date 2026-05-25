import { Suspense, type ReactNode } from "react";

import { PanelTabNavFallback } from "@/components/layout/panel-tab-nav";

type ContentPanelProps = {
  children: ReactNode;
  header?: ReactNode;
  /** 为 true 时对 header 包 Suspense，适用于依赖 useSearchParams 的 Tab 导航 */
  suspenseHeader?: boolean;
};

/** 主内容大卡片外壳：统一圆角边框样式，顶部导航区可插槽替换。 */
export function ContentPanel({
  children,
  header,
  suspenseHeader = false,
}: ContentPanelProps) {
  const headerNode = header
    ? suspenseHeader
      ? (
          <Suspense fallback={<PanelTabNavFallback />}>{header}</Suspense>
        )
      : header
    : null;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex min-h-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        {headerNode}
        {children}
      </div>
    </section>
  );
}
