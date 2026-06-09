"use client";

import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import { EditorEntryLink } from "./editor-entry-link";
import { btnCreateAction } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type StartCreateLinkProps = {
  className?: string;
  children?: ReactNode;
};

/** 右侧栏「开始创作」：进入编辑器时保留当前页面为返回目标。 */
export function StartCreateLink({ className, children }: StartCreateLinkProps) {
  return (
    <EditorEntryLink className={cn(btnCreateAction, "flex w-full", className)}>
      <Plus className="h-4 w-4 text-white" strokeWidth={2.5} />
      <span className="text-white">{children ?? "开始创作"}</span>
    </EditorEntryLink>
  );
}
