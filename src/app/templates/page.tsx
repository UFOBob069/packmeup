import Link from "next/link";
import { Plus, Sparkles, Waves, Flag } from "lucide-react";
import { AppShell } from "@/components/layout/header";
import { ActivityTag } from "@/components/design/activity-tag";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/actions/trips";
import { getDemoTemplates } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

const templateIcons: Record<string, typeof Sparkles> = {
  "tpl-golf": Flag,
  "tpl-beach": Waves,
};

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  if (!user && !isDemoMode()) redirect("/login");

  const templates = user && isDemoMode() ? getDemoTemplates(user.id) : [];

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-display text-3xl font-semibold tracking-tight">Templates</h1>
        <p className="mt-2 text-muted-foreground">
          Jump-start your next trip with a preset — customize as you go.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((tpl) => {
          const Icon = templateIcons[tpl.id] ?? Sparkles;
          return (
            <Link
              key={tpl.id}
              href={`/trips/new?template=${tpl.id}`}
              className="group overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-travel-sm"
            >
              <div className="h-1.5 bg-gradient-to-r from-primary to-ocean-teal" />
              <div className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-display text-lg font-semibold group-hover:text-primary">
                  {tpl.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {tpl.description}
                </p>
                {(tpl.template_data.activities ?? []).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(tpl.template_data.activities ?? []).map((a) => (
                      <ActivityTag key={a} name={a} />
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Save any trip as a template for next time.
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link href="/trips/new">
              <Plus className="mr-2 h-4 w-4" />
              Plan a new trip
            </Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
