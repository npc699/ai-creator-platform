import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ScrollToTopButton } from "@/components/layout/scroll-to-top-button";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { Role } from "@/lib/generated/prisma/client";

export type DashboardUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: string | null;
  role?: Role;
};

type DashboardShellProps = {
  user: DashboardUser;
  children: React.ReactNode;
};

function getDisplayName(user: DashboardUser) {
  return user.name ?? user.email ?? user.phone ?? "创作者";
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const displayName = getDisplayName(user);
  const isAdmin = user.role === Role.ADMIN;

  return (
    <AuthSessionProvider>
      <div className="flex min-h-screen flex-col bg-brand-surface/30">
        <AppHeader
          displayName={displayName}
          email={user.email}
          isAdmin={isAdmin}
          phone={user.phone}
        />
        <div className="mx-auto flex w-full max-w-[1440px] flex-1 min-h-0 items-stretch gap-4 px-4 pb-6 pt-4 lg:px-6">
          <AppSidebar />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
        </div>
        <ScrollToTopButton />
      </div>
    </AuthSessionProvider>
  );
}
