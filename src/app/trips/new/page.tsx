import { Plane } from "lucide-react";
import { AppShell } from "@/components/layout/header";
import { TripOnboardingChat } from "@/components/trip/trip-onboarding-chat";
import { getDemoTemplates } from "@/lib/demo/store";
import { getCurrentUser } from "@/actions/trips";
import { isDemoMode } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

interface NewTripPageProps {
  searchParams: Promise<{ template?: string }>;
}

export default async function NewTripPage({ searchParams }: NewTripPageProps) {
  const user = await getCurrentUser();
  if (!user && !isDemoMode()) redirect("/login");

  const params = await searchParams;
  let templateData;

  if (params.template && user && isDemoMode()) {
    const templates = getDemoTemplates(user.id);
    const tpl = templates.find((t) => t.id === params.template);
    if (tpl) templateData = tpl.template_data;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Plane className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-display text-3xl font-semibold tracking-tight">
            Plan your trip
          </h1>
          <p className="mt-2 text-muted-foreground">
            A quick conversation — then your packing list, outfits, and timeline are ready.
          </p>
        </div>
        <TripOnboardingChat templateData={templateData} />
      </div>
    </AppShell>
  );
}
