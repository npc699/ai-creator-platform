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

  // 沉浸式编辑器占满视口，滚动交给内部编辑区与右侧面板。
  return <div className="h-screen overflow-hidden bg-zinc-50">{children}</div>;
}
