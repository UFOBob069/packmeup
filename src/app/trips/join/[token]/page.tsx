import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ArrowRight, Luggage, Users } from "lucide-react";
import { MarketingShell } from "@/components/layout/shells";
import { Button } from "@/components/ui/button";
import { DestinationCover } from "@/components/trip/destination-cover";
import {
  getCurrentUser,
  getTripPreviewByShareToken,
  joinTripByShareToken,
} from "@/actions/trips";

interface JoinTripPageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinTripPage({ params }: JoinTripPageProps) {
  const { token } = await params;
  const preview = await getTripPreviewByShareToken(token);
  if (!preview) notFound();

  const user = await getCurrentUser();
  if (user) {
    const result = await joinTripByShareToken(token);
    redirect(`/trips/${result.tripId}`);
  }

  const loginHref = `/login?next=${encodeURIComponent(`/trips/join/${token}`)}`;

  return (
    <MarketingShell>
      <section className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-4 py-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl border bg-card shadow-travel">
          <DestinationCover
            destination={preview.destination}
            coverImageUrl={preview.cover_image_url}
            variant="preview"
            className="rounded-none"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-white/80">
              Shared trip invite
            </p>
            <h1 className="text-display mt-1 text-2xl font-semibold text-white">
              {preview.destination}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              {format(parseISO(preview.start_date), "MMM d")} –{" "}
              {format(parseISO(preview.end_date), "MMM d, yyyy")}
            </p>
          </DestinationCover>

          <div className="space-y-5 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-display font-semibold">Join this packing workspace</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in to collaborate on packing, weather, outfits, and trip prep.
                </p>
              </div>
            </div>

            <Button asChild size="lg" className="h-12 w-full rounded-full text-base">
              <Link href={loginHref}>
                <Luggage className="mr-2 h-4 w-4" />
                Sign in to join
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
