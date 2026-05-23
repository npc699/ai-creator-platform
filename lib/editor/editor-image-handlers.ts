import type { Editor } from "@tiptap/react";

import { uploadEditorImage } from "@/lib/editor/upload-image";

type CreateEditorImageHandlersParams = {
  getEditor: () => Editor | null;
  uploadImage?: (file: File) => Promise<{ url: string }>;
  onUploadingChange?: (uploading: boolean) => void;
  onUploadError?: (message: string) => void;
};

function collectImageFiles(fileList: FileList | null | undefined) {
  if (!fileList?.length) {
    return [];
  }

  return Array.from(fileList).filter((file) => file.type.startsWith("image/"));
}

async function insertUploadedImages(
  editor: Editor,
  files: File[],
  uploadImage: (file: File) => Promise<{ url: string }>,
  onUploadingChange?: (uploading: boolean) => void,
  onUploadError?: (message: string) => void
) {
  if (files.length === 0) {
    return false;
  }

  onUploadingChange?.(true);

  try {
    for (const file of files) {
      const asset = await uploadImage(file);
      editor.chain().focus().setImage({ src: asset.url, alt: file.name }).run();
    }
    return true;
  } catch (error) {
    onUploadError?.(error instanceof Error ? error.message : "图片上传失败");
    return true;
  } finally {
    onUploadingChange?.(false);
  }
}

export function createEditorImageHandlers({
  getEditor,
  uploadImage = uploadEditorImage,
  onUploadingChange,
  onUploadError,
}: CreateEditorImageHandlersParams) {
  return {
    handlePaste(_view: unknown, event: ClipboardEvent) {
      const editor = getEditor();
      if (!editor || !event.clipboardData) {
        return false;
      }

      const imageFiles = collectImageFiles(event.clipboardData.files);
      if (imageFiles.length === 0) {
        return false;
      }

      event.preventDefault();
      void insertUploadedImages(
        editor,
        imageFiles,
        uploadImage,
        onUploadingChange,
        onUploadError
      );
      return true;
    },

    handleDrop(_view: unknown, event: DragEvent) {
      const editor = getEditor();
      if (!editor || !event.dataTransfer) {
        return false;
      }

      const imageFiles = collectImageFiles(event.dataTransfer.files);
      if (imageFiles.length === 0) {
        return false;
      }

      event.preventDefault();
      void insertUploadedImages(
        editor,
        imageFiles,
        uploadImage,
        onUploadingChange,
        onUploadError
      );
      return true;
    },
  };
}
