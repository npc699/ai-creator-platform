"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  btnCreateAction,
  btnCreateActionDisabled,
  btnEditorHeaderGhost,
} from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type AuthorProfileEditFieldsProps = {
  name: string;
  bio: string;
  onNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  errorMessage?: string | null;
  isSaving?: boolean;
  onCancel?: () => void;
};

export function AuthorProfileEditFields({
  name,
  bio,
  onNameChange,
  onBioChange,
  errorMessage,
  isSaving = false,
  onCancel,
}: AuthorProfileEditFieldsProps) {
  return (
    <>
      <label className="block">
        <span className="text-xs font-medium text-zinc-600">昵称</span>
        <input
          className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
          maxLength={50}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="展示给其他用户的名称"
          value={name}
        />
      </label>

      <label className="mt-3 block">
        <span className="text-xs font-medium text-zinc-600">简介</span>
        <textarea
          className="mt-1 w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-900 outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
          maxLength={500}
          onChange={(event) => onBioChange(event.target.value)}
          placeholder="介绍一下自己（选填）"
          rows={4}
          value={bio}
        />
      </label>

      {errorMessage ? (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      ) : null}

      {onCancel ? (
        <div className="mt-5 flex justify-end gap-2">
          <button
            className={btnEditorHeaderGhost}
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            取消
          </button>
          <button
            className={cn(
              isSaving ? btnCreateActionDisabled : btnCreateAction,
              "px-4 py-2 text-sm"
            )}
            disabled={isSaving}
            type="submit"
          >
            {isSaving ? "保存中…" : "保存"}
          </button>
        </div>
      ) : null}
    </>
  );
}

type AuthorProfileEditDialogProps = {
  initialName: string;
  initialBio: string;
  onClose: () => void;
};

export function AuthorProfileEditDialog({
  initialName,
  initialBio,
  onClose,
}: AuthorProfileEditDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setErrorMessage(payload?.error ?? "保存失败，请稍后重试");
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setErrorMessage("保存失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-black/40 p-4"
      onClick={isSaving ? undefined : onClose}
      role="presentation"
    >
      <div
        aria-labelledby="profile-edit-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <h2 className="text-lg font-semibold text-zinc-900" id="profile-edit-title">
          编辑资料
        </h2>
        <p className="mt-1 text-sm text-zinc-500">修改后将展示在你的公开主页上</p>

        <form className="mt-4" onSubmit={handleSubmit}>
          <AuthorProfileEditFields
            bio={bio}
            errorMessage={errorMessage}
            isSaving={isSaving}
            name={name}
            onBioChange={setBio}
            onCancel={onClose}
            onNameChange={setName}
          />
        </form>
      </div>
    </div>
  );
}

type AuthorProfileEditSectionProps = {
  initialName: string;
  initialBio: string;
};

/** 本人主页：「编辑资料」按钮 + 弹窗表单。 */
export function AuthorProfileEditSection({
  initialName,
  initialBio,
}: AuthorProfileEditSectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={cn(btnEditorHeaderGhost, "shrink-0")}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Pencil className="h-4 w-4" aria-hidden />
        编辑资料
      </button>

      {open ? (
        <AuthorProfileEditDialog
          initialBio={initialBio}
          initialName={initialName}
          key={`${initialName}-${initialBio}`}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
