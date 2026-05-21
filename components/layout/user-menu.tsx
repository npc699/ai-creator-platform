"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { borderBrandSoft, headerBadge } from "@/lib/utils/brand";
import { cn } from "@/lib/utils";

type UserMenuProps = {
  displayName: string;
  subtitle?: string | null;
  isAdmin?: boolean;
};

export function UserMenu({ displayName, subtitle, isAdmin }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const avatarLabel = displayName.slice(0, 1).toUpperCase();

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
    <div className="relative">
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
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium text-zinc-900">
            {displayName}
          </span>
          {subtitle ? (
            <span className="block text-xs text-zinc-500">{subtitle}</span>
          ) : null}
        </span>
      </button>

      {open ? (
        <>
          <button
            aria-label="关闭菜单"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div
            className={cn(
              "absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
            )}
            role="menu"
          >
            <div className="border-b border-zinc-100 px-4 py-3">
              <p className="text-sm font-medium text-zinc-900">{displayName}</p>
              {subtitle ? (
                <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>
              ) : null}
              {isAdmin ? (
                <p className="mt-1 text-xs font-medium text-brand-primary">管理员</p>
              ) : null}
            </div>
            <button
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              disabled={isSigningOut}
              onClick={handleSignOut}
              role="menuitem"
              type="button"
            >
              <LogOut className="h-4 w-4" />
              {isSigningOut ? "退出中..." : "退出登录"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
