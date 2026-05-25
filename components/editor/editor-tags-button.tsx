"use client";

import { Tags } from "lucide-react";
import { useState } from "react";

import { EditorTagsDialog } from "@/components/editor/editor-tags-dialog";
import { useEditorContext } from "@/components/editor/editor-context";
import {
  btnEditorHeaderGhost,
  btnEditorHeaderGhostDisabled,
} from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

/** 编辑器顶栏「标签」按钮，位于保存状态与保存按钮之间。 */
export function EditorTagsButton() {
  const { saveStatus, isUploadingImage } = useEditorContext();
  const [dialogOpen, setDialogOpen] = useState(false);

  const isSaving = saveStatus === "saving";
  const isBusy = isSaving || isUploadingImage;

  return (
    <>
      <button
        className={cn(btnEditorHeaderGhost, btnEditorHeaderGhostDisabled)}
        disabled={isBusy}
        onClick={() => setDialogOpen(true)}
        type="button"
      >
        <Tags className="h-4 w-4" />
        标签
      </button>
      <EditorTagsDialog onClose={() => setDialogOpen(false)} open={dialogOpen} />
    </>
  );
}
