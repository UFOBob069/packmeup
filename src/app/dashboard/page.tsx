import Link from "next/link";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { TripCard } from "@/components/trip/trip-card";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getUserTrips, getTripDetails } from "@/actions/trips";
import { getDemoTemplates } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user && !isDemoMode()) redirect("/login");

  const trips = user ? await getUserTrips() : [];
  const templates = user && isDemoMode() ? getDemoTemplates(user.id) : [];

  const now = new Date().toISOString().split("T")[0];
  const upcoming = trips.filter((t) => t.end_date >= now);
  const past = trips.filter((t) => t.end_date < now);

  const tripDetails = await Promise.all(
    trips.map(async (t) => {
      const details = await getTripDetails(t.id);
      return {
        trip: t,
        travelers: details?.travelers ?? [],
        items: details?.packing_items ?? [],
      };
    })
  );

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {user?.name ? `Hey, ${user.name.split(" ")[0]}!` : "Your Trips"}
            </h1>
            <p className="text-muted-foreground">Plan, pack, and travel together.</p>
          </div>
          <Button asChild>
            <Link href="/trips/new">
              <Plus className="mr-2 h-4 w-4" />
              New Trip
            </Link>
          </Button>
        </div>

        {upcoming.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold">Upcoming Trips</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tripDetails
                .filter(({ trip }) => trip.end_date >= now)
                .map(({ trip, travelers, items }) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    travelers={travelers}
                    packingItems={items}
                  />
                ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-semibold">Past Trips</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tripDetails
                .filter(({ trip }) => trip.end_date < now)
                .map(({ trip, travelers, items }) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    travelers={travelers}
                    packingItems={items}
                  />
                ))}
            </div>
          </section>
        )}

        {trips.length === 0 && (
          <div className="rounded-2xl border border-dashed py-16 text-center">
            <p className="text-muted-foreground">No trips yet. Start planning your first adventure!</p>
            <Button asChild className="mt-4">
              <Link href="/trips/new">Create Your First Trip</Link>
            </Button>
          </div>
        )}

        {templates.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Templates</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href="/templates">View all</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.slice(0, 3).map((tpl) => (
                <Link
                  key={tpl.id}
                  href={`/trips/new?template=${tpl.id}`}
                  className="rounded-xl border p-4 transition-colors hover:bg-muted/50"
                >
                  <h3 className="font-medium">{tpl.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{tpl.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
