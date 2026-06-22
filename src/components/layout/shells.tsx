import { getCurrentUser } from "@/actions/trips";
import { Header } from "./header";
import type { Profile } from "@/lib/types";

interface ShellProps {
  children: React.ReactNode;
}

export async function AppShell({ children }: ShellProps) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="app" user={user} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-8">
        {children}
      </main>
    </div>
  );
}

export async function MarketingShell({ children }: ShellProps) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen flex-col">
      <Header variant="landing" user={user} />
      {children}
    </div>
  );
}

export type { Profile };
