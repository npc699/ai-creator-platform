"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { type FormEvent, useState } from "react";

import {
  authEyebrowClass,
  authInputClass,
  authLinkClass,
  authSubmitButtonClass,
} from "@/lib/utils/auth-form";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() && !phone.trim()) {
      setError("请至少填写邮箱或手机号");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "注册失败，请稍后重试");
      setIsSubmitting(false);
      return;
    }

    const loginIdentifier = phone.trim() || email.trim();

    const result = await signIn("credentials", {
      identifier: loginIdentifier,
      password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setError("注册成功，但自动登录失败，请手动登录");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="auth-page flex min-h-screen items-center justify-center bg-white px-6 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div>
          <p className={authEyebrowClass}>AI Creator Platform</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            创建账号
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            邮箱与手机号至少填写一项，注册成功后将自动登录。
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">
              用户名
            </label>
            <input
              required
              autoComplete="name"
              className={authInputClass}
              id="name"
              maxLength={20}
              name="name"
              onChange={(event) => setName(event.target.value)}
              type="text"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              邮箱（选填）
            </label>
            <input
              autoComplete="email"
              className={authInputClass}
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              type="text"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="phone">
              手机号（选填）
            </label>
            <input
              autoComplete="tel"
              className={authInputClass}
              id="phone"
              name="phone"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="13800138000"
              type="tel"
              value={phone}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              密码
            </label>
            <input
              required
              autoComplete="new-password"
              className={authInputClass}
              id="password"
              maxLength={32}
              minLength={6}
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="confirmPassword">
              确认密码
            </label>
            <input
              required
              autoComplete="new-password"
              className={authInputClass}
              id="confirmPassword"
              maxLength={32}
              minLength={6}
              name="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              value={confirmPassword}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            className={authSubmitButtonClass}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "注册中..." : "注册并登录"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          已有账号？{" "}
          <Link className={authLinkClass} href="/login">
            去登录
          </Link>
        </p>
      </div>
    </main>
  );
}
