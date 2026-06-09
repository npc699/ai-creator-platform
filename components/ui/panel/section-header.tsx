import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SectionIconTone = "amber" | "emerald" | "zinc";

/** @deprecated 使用 SectionIconTone */
export type PanelSectionIconTone = SectionIconTone;

type SectionHeaderProps = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconTone?: SectionIconTone;
};

const iconToneClass: Record<SectionIconTone, string> = {
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  zinc: "bg-zinc-100 text-zinc-600",
};

/** 内容区大卡片顶部：图标 + 标题 + 说明。 */
export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  iconTone = "zinc",
}: SectionHeaderProps) {
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

/** @deprecated 使用 SectionHeader */
export const PanelSectionHeader = SectionHeader;
