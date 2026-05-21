"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import React, { useState } from "react";

import { resolveSafeCallbackUrl } from "@/lib/auth/safe-callback-url";
import { btnSoft } from "@/lib/utils/brand";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("账号或密码不正确");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const callbackPath = resolveSafeCallbackUrl(
      params.get("callbackUrl"),
      window.location.origin
    );

    router.push(callbackPath);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className="text-sm font-medium text-brand-primary">
            AI Creator Platform
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            登录账号
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            使用邮箱或手机号与密码进入创作者工作台。
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="identifier">
              邮箱或手机号
            </label>
            <input
              required
              autoComplete="username"
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-surface dark:border-zinc-700"
              id="identifier"
              name="identifier"
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="name@example.com 或 13800138000"
              type="text"
              value={identifier}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              密码
            </label>
            <input
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-surface dark:border-zinc-700"
              id="password"
              minLength={6}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${btnSoft}`}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "登录中..." : "登录"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          还没有账号？{" "}
          <Link
            className="font-medium text-brand-primary hover:text-blue-600"
            href="/register"
          >
            去注册
          </Link>
        </p>
      </div>
    </main>
  );
}
