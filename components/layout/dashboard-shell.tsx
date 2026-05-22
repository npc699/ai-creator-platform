import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
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
      <div className="min-h-screen bg-brand-surface/30">
        <AppHeader
          displayName={displayName}
          email={user.email}
          isAdmin={isAdmin}
          phone={user.phone}
        />
        <div className="mx-auto flex w-full max-w-[1440px] items-stretch gap-4 px-4 pb-6 pt-4 lg:px-6">
          <AppSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
