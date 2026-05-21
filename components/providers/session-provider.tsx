"use client";

import { SessionProvider } from "next-auth/react";

// 主应用区 Client 组件需要调用 signIn/signOut 时挂载。
export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
