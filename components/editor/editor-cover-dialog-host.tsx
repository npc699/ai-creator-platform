"use client";

import { EditorCoverDialog } from "@/components/editor/editor-cover-dialog";
import { useEditorContext } from "@/components/editor/editor-context";

/** 在 EditorProvider 内挂载封面弹窗，供顶栏与内容区共用。 */
export function EditorCoverDialogHost() {
  const { isCoverDialogOpen, closeCoverDialog } = useEditorContext();

  if (!isCoverDialogOpen) {
    return null;
  }

  return <EditorCoverDialog onClose={closeCoverDialog} />;
}
