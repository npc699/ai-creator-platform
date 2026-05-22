"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import React, { useState } from "react";

import { resolveSafeCallbackUrl } from "@/lib/auth/safe-callback-url";
import {
  authEyebrowClass,
  authInputClass,
  authLinkClass,
  authSubmitButtonClass,
} from "@/lib/utils/auth-form";

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
    <main className="auth-page flex min-h-screen items-center justify-center bg-white px-6 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className={authEyebrowClass}>AI Creator Platform</p>
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
              className={authInputClass}
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
              className={authInputClass}
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
            className={authSubmitButtonClass}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "登录中..." : "登录"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          还没有账号？{" "}
          <Link className={authLinkClass} href="/register">
            去注册
          </Link>
        </p>
      </div>
    </main>
  );
}
