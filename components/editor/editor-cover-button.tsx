"use client";

import { ImageIcon } from "lucide-react";

import { useEditorContext } from "@/components/editor/editor-context";
import {
  btnEditorHeaderGhost,
  btnEditorHeaderGhostDisabled,
} from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

/** 编辑器顶栏「封面」按钮，位于「标签」左侧。 */
export function EditorCoverButton() {
  const { saveStatus, isUploadingImage, openCoverDialog } = useEditorContext();

  const isSaving = saveStatus === "saving";
  const isBusy = isSaving || isUploadingImage;

  return (
    <button
      className={cn(btnEditorHeaderGhost, btnEditorHeaderGhostDisabled)}
      disabled={isBusy}
      onClick={openCoverDialog}
      type="button"
    >
      <ImageIcon className="h-4 w-4" />
      封面
    </button>
  );
}
