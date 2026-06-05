import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type PanelSectionIconTone = "amber" | "emerald" | "zinc";

type PanelSectionHeaderProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconTone?: PanelSectionIconTone;
};

const iconToneClass: Record<PanelSectionIconTone, string> = {
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  zinc: "bg-zinc-100 text-zinc-600",
};

/** 内容区大卡片顶部：图标 + 标题 + 说明，供频道榜、草稿箱等页面复用。 */
export function PanelSectionHeader({
  title,
  subtitle,
  icon: Icon,
  iconTone = "zinc",
}: PanelSectionHeaderProps) {
  return (
    <header className="border-b border-zinc-100 px-5 py-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            iconToneClass[iconTone]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-zinc-900">{title}</h1>
          <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}
