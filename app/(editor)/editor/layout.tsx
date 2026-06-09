import { redirect } from "next/navigation";

import { EditorShell } from "@/components/editor";
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

  return <EditorShell userId={user.id}>{children}</EditorShell>;
}
