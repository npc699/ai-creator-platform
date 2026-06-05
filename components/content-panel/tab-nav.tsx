"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

export type PanelTabOption = {
  key: string;
  label: string;
  href: string;
};

function panelTabClass(isActive: boolean) {
  return cn(
    "group relative inline-flex h-10 items-center justify-center px-4 text-sm transition-colors duration-200 ease-out",
    isActive ? "font-semibold" : "font-medium"
  );
}

function panelTabLabelClass(isActive: boolean) {
  return cn(
    "transition-colors duration-200 ease-out",
    isActive
      ? "text-brand-primary"
      : "text-zinc-900 group-hover:text-brand-primary"
  );
}

function panelTabIndicatorClass(isActive: boolean) {
  return cn(
    "absolute bottom-0 left-1/2 h-[3px] w-8 origin-center -translate-x-1/2 rounded-full bg-brand-primary transition-transform duration-300 ease-out",
    isActive ? "scale-x-100" : "scale-x-0"
  );
}

export function PanelTabNavFallback() {
  return (
    <div className="border-b border-zinc-200/80 px-4 py-3">
      <div className="h-10" />
    </div>
  );
}

type PanelTabNavProps = {
  ariaLabel: string;
  options: PanelTabOption[];
  activeKey: string;
};

/** 大卡片顶部 Tab 导航，供 Feed / 草稿 / Prompt / 素材等页面复用。 */
export function PanelTabNav({
  ariaLabel,
  options,
  activeKey,
}: PanelTabNavProps) {
  return (
    <div className="border-b border-zinc-200/80 px-4 py-3">
      <nav aria-label={ariaLabel} className="flex flex-wrap items-center gap-6">
        {options.map(({ key, label, href }) => {
          const isActive = activeKey === key;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={panelTabClass(isActive)}
              href={href}
              key={key}
            >
              <span className={panelTabLabelClass(isActive)}>{label}</span>
              <span aria-hidden className={panelTabIndicatorClass(isActive)} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
