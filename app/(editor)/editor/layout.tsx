import { redirect } from "next/navigation";

import { EditorLayoutClient } from "@/app/(editor)/editor/editor-layout-client";
import { getCurrentUser } from "@/lib/auth";

export default async function EditorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/login");
  }

  return <EditorLayoutClient userId={user.id}>{children}</EditorLayoutClient>;
}
