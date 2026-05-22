import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export default async function EditorRouteGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  // 编辑器使用独立沉浸式布局，但仍需在服务端校验登录状态。
  if (!user) {
    redirect("/login");
  }

  return <div className="min-h-screen bg-zinc-50">{children}</div>;
}
