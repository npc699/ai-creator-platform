"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type AssetLibraryAccordionProps = {
  title: string;
  icon: LucideIcon;
  expanded: boolean;
  onToggle: () => void;
  badge?: number;
  children: React.ReactNode;
};

/** 素材库手风琴区块：标题栏可点击展开/折叠，带高度与图标过渡。 */
export function AssetLibraryAccordion({
  title,
  icon: Icon,
  expanded,
  onToggle,
  badge,
  children,
}: AssetLibraryAccordionProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white">
      <button
        aria-expanded={expanded}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors duration-200 ease-out",
          expanded ? "bg-[#fdfcf8] text-zinc-900" : "bg-zinc-50/80 text-zinc-700 hover:bg-zinc-100/80"
        )}
        onClick={onToggle}
        type="button"
      >
        <Icon className="h-4 w-4 shrink-0 text-brand-primary" />
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {typeof badge === "number" ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-surface px-1.5 text-xs font-semibold text-brand-primary">
            {badge}
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ease-out",
            expanded && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div
          className={cn(
            "overflow-hidden transition-opacity duration-200 ease-out",
            expanded ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="border-t border-zinc-100 p-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

type ValidationStatusProps = {
  ok: boolean;
  message: string;
};

export function AssetLibraryValidationStatus({ ok, message }: ValidationStatusProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-xs leading-5",
        ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      )}
    >
      <span aria-hidden className="font-semibold">
        {ok ? "✓" : "✕"}
      </span>
      {message}
    </p>
  );
}
