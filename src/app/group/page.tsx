import { AppShell } from "@/components/layout/shells";
import { MyGroupPanel } from "@/components/group/my-group-panel";
import { getUserGroupMembers } from "@/actions/group";
import { getCurrentUser } from "@/actions/trips";
import { isDemoMode } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

export default async function GroupPage() {
  const user = await getCurrentUser();
  if (!user && !isDemoMode()) redirect("/login");

  const members = user ? await getUserGroupMembers() : [];

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-display text-3xl font-semibold tracking-tight">My Group</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Your usual travel crew — add people here or they&apos;re saved automatically when you
          include them on a trip. Pick from My Group when starting your next packing list.
        </p>
      </div>

      <div className="max-w-2xl">
        <MyGroupPanel members={members} />
      </div>
    </AppShell>
  );
}
