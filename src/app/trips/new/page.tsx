import { Header } from "@/components/layout/header";
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
    <>
      <Header />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Plan Your Trip</h1>
          <p className="text-muted-foreground">
            Answer a few quick questions and we&apos;ll build your packing list.
          </p>
        </div>
        <TripOnboardingChat templateData={templateData} />
      </main>
    </>
  );
}
