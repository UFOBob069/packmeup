import Link from "next/link";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/actions/trips";
import { getDemoTemplates } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  if (!user && !isDemoMode()) redirect("/login");

  const templates = user && isDemoMode() ? getDemoTemplates(user.id) : [];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
            <p className="text-muted-foreground">Reusable trip presets for faster planning.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <Link
              key={tpl.id}
              href={`/trips/new?template=${tpl.id}`}
              className="group rounded-xl border p-6 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <h3 className="font-semibold group-hover:text-primary">{tpl.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{tpl.description}</p>
              {(tpl.template_data.activities ?? []).length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {(tpl.template_data.activities ?? []).join(" · ")}
                </p>
              )}
            </Link>
          ))}

          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Save a trip as a template from the trip detail page.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/trips/new">
                <Plus className="mr-2 h-4 w-4" />
                New Trip
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}
