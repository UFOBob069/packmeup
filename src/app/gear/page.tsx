import { AppShell } from "@/components/layout/shells";
import { MyGearPanel } from "@/components/gear/my-gear-panel";
import { getUserGearItems } from "@/actions/gear";
import { getCurrentUser } from "@/actions/trips";
import { isDemoMode } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

export default async function GearPage() {
  const user = await getCurrentUser();
  if (!user && !isDemoMode()) redirect("/login");

  const gearItems = user ? await getUserGearItems() : [];

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-display text-3xl font-semibold tracking-tight">My Gear</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Build your personal library of travel items. Add gear here, or save specifics from any
          packing list with &ldquo;Save to My Gear.&rdquo;
        </p>
      </div>

      <div className="max-w-2xl">
        <MyGearPanel items={gearItems} />
      </div>
    </AppShell>
  );
}
