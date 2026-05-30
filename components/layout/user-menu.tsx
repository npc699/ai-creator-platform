"use client";

import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { buildAuthorProfilePath } from "@/lib/users/profile-navigation";
import { borderBrandSoft, headerBadge } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  userId: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  isAdmin?: boolean;
};

export function UserMenu({
  userId,
  displayName,
  email,
  phone,
  isAdmin,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarLabel = displayName.slice(0, 1).toUpperCase();

  // Header 为 sticky 时会限制内部 fixed 遮罩的命中范围，改为监听文档点击关闭。
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setIsSigningOut(true);
    setOpen(false);

    // 调用 Auth.js 登出接口清理会话 Cookie，并跳转到登录页。
    await signOut({
      callbackUrl: "/login",
      redirect: true,
    });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-3 transition",
          borderBrandSoft,
          "hover:border-brand-border hover:bg-brand-surface"
        )}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
            headerBadge
          )}
        >
          {avatarLabel}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-medium text-zinc-900 sm:block">
          {displayName}
        </span>
      </button>

      {open ? (
          <div
            className={cn(
              "absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
            )}
            role="menu"
          >
            <div className="border-b border-zinc-100 px-4 py-3">
              <p className="text-sm font-medium text-zinc-900">{displayName}</p>
              {email && email !== displayName ? (
                <p className="mt-1 break-all text-xs text-zinc-500">{email}</p>
              ) : null}
              {phone && phone !== displayName ? (
                <p className="mt-1 text-xs text-zinc-500">{phone}</p>
              ) : null}
              {isAdmin ? (
                <p className="mt-1 text-xs font-medium text-brand-primary">管理员</p>
              ) : null}
            </div>
            <Link
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-zinc-700 transition hover:bg-zinc-50"
              href={buildAuthorProfilePath(userId)}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              <User className="h-4 w-4" />
              我的主页
            </Link>
            <button
              className="flex w-full items-center gap-2 border-t border-zinc-100 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              disabled={isSigningOut}
              onClick={handleSignOut}
              role="menuitem"
              type="button"
            >
              <LogOut className="h-4 w-4" />
              {isSigningOut ? "退出中..." : "退出登录"}
            </button>
          </div>
      ) : null}
    </div>
  );
}
