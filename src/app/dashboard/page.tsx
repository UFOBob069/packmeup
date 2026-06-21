import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/header";
import { TripCard } from "@/components/trip/trip-card";
import { CountdownWidget } from "@/components/design/countdown-widget";
import { WeatherPreview } from "@/components/design/weather-card";
import { AiSuggestionList } from "@/components/design/ai-suggestion-card";
import { TravelerAvatar } from "@/components/design/traveler-avatar";
import { EmptyTrips } from "@/components/design/empty-state";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getUserTrips, getTripDetails } from "@/actions/trips";
import { getDemoTemplates, calculateProgress } from "@/lib/demo/store";
import { generateAiRecommendations } from "@/lib/design-system";
import { isDemoMode } from "@/lib/supabase/client";
import { differenceInDays, parseISO } from "date-fns";
import { redirect } from "next/navigation";
import type { WeatherData } from "@/lib/types";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user && !isDemoMode()) redirect("/login");

  const trips = user ? await getUserTrips() : [];
  const templates = user && isDemoMode() ? getDemoTemplates(user.id) : [];

  const now = new Date().toISOString().split("T")[0];
  const upcoming = trips.filter((t) => t.end_date >= now);

  const tripDetails = await Promise.all(
    trips.map(async (t) => {
      const details = await getTripDetails(t.id);
      return {
        trip: t,
        travelers: details?.travelers ?? [],
        items: details?.packing_items ?? [],
        activities: details?.activities ?? [],
        weather: details?.weather_data as WeatherData | null,
      };
    })
  );

  const featured = tripDetails.find(({ trip }) => trip.end_date >= now);
  const daysUntil = featured
    ? differenceInDays(parseISO(featured.trip.start_date), new Date())
    : null;

  const aiRecs =
    featured && featured.items.length
      ? generateAiRecommendations(featured.items, featured.travelers, featured.weather)
      : [];

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {featured && daysUntil !== null && daysUntil >= 0
              ? `Packing for ${featured.trip.destination.split(",")[0]}`
              : "Your packing lists"}
          </p>
          <h1 className="text-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Hey, {firstName} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            {upcoming.length > 0
              ? "Ready to get packed?"
              : "What are you packing for next?"}
          </p>
        </div>
        <Button asChild className="rounded-full px-6 shadow-travel-sm">
          <Link href="/trips/new">
            <Plus className="mr-2 h-4 w-4" />
            Start packing
          </Link>
        </Button>
      </div>

      {trips.length === 0 ? (
        <EmptyTrips />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {featured && daysUntil !== null && daysUntil >= 0 && (
              <CountdownWidget
                days={daysUntil}
                destination={featured.trip.destination}
              />
            )}

            {upcoming.length > 0 && (
              <section>
                <h2 className="text-display mb-4 text-lg font-semibold">Upcoming packing lists</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tripDetails
                    .filter(({ trip }) => trip.end_date >= now)
                    .map(({ trip, travelers, items, activities }, i) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        travelers={travelers}
                        packingItems={items}
                        activities={activities}
                        featured={i === 0}
                      />
                    ))}
                </div>
              </section>
            )}

            {tripDetails.filter(({ trip }) => trip.end_date < now).length > 0 && (
              <section>
                <h2 className="text-display mb-4 text-lg font-semibold text-muted-foreground">
                  Past packing lists
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {tripDetails
                    .filter(({ trip }) => trip.end_date < now)
                    .map(({ trip, travelers, items, activities }) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        travelers={travelers}
                        packingItems={items}
                        activities={activities}
                      />
                    ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            {featured?.weather && featured.weather.daily?.length > 0 && (
              <WeatherPreview
                location={featured.weather.location ?? featured.trip.destination}
                days={featured.weather.daily}
              />
            )}

            {featured && featured.travelers.length > 0 && (
              <div className="rounded-2xl border bg-card p-5 shadow-travel-sm">
                <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Who&apos;s packing
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  {featured.travelers.map((t, i) => {
                    const prog = calculateProgress(featured.items, featured.travelers);
                    const stats = prog.byTraveler[t.id];
                    return (
                      <TravelerAvatar
                        key={t.id}
                        name={t.name}
                        type={t.traveler_type}
                        index={i}
                        size="lg"
                        showName
                        packed={stats?.packed}
                        total={stats?.total}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {aiRecs.length > 0 && (
              <div className="rounded-2xl border bg-card p-5 shadow-travel-sm">
                <AiSuggestionList recommendations={aiRecs} />
              </div>
            )}

            {templates.length > 0 && (
              <div className="rounded-2xl border bg-card p-5 shadow-travel-sm">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Packing templates
                  </p>
                  <Link href="/templates" className="text-xs font-medium text-primary hover:underline">
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {templates.slice(0, 2).map((tpl) => (
                    <Link
                      key={tpl.id}
                      href={`/trips/new?template=${tpl.id}`}
                      className="flex items-center gap-3 rounded-xl border bg-background p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tpl.name}</p>
                        <p className="text-xs text-muted-foreground">{tpl.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
