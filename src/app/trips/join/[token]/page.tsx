import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowRight, Luggage, Users } from "lucide-react";
import { MarketingShell } from "@/components/layout/shells";
import { Button } from "@/components/ui/button";
import { DestinationCover } from "@/components/trip/destination-cover";
import {
  getCurrentUser,
  getTripPreviewByShareToken,
} from "@/actions/trips";
import { getAppUrl } from "@/lib/app-url";
import {
  destinationCity,
  formatInviteDateRange,
  inviteShareDescription,
  inviteShareTitle,
} from "@/lib/invite-share";
import { APP_NAME } from "@/lib/constants";

interface JoinTripPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}

export async function generateMetadata({ params }: JoinTripPageProps): Promise<Metadata> {
  const { token } = await params;
  const preview = await getTripPreviewByShareToken(token);
  if (!preview) {
    return { title: "Trip invite" };
  }

  const title = inviteShareTitle({
    inviterName: preview.inviter_name,
    destination: preview.destination,
  });
  const description = inviteShareDescription({
    inviterName: preview.inviter_name,
    destination: preview.destination,
    startDate: preview.start_date,
    endDate: preview.end_date,
  });
  const url = `${getAppUrl()}/trips/join/${token}`;
  const images = preview.cover_image_url
    ? [
        {
          url: preview.cover_image_url,
          width: 1200,
          height: 630,
          alt: destinationCity(preview.destination),
        },
      ]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: APP_NAME,
      type: "website",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: preview.cover_image_url ? [preview.cover_image_url] : undefined,
    },
  };
}

export default async function JoinTripPage({ params, searchParams }: JoinTripPageProps) {
  const { token } = await params;
  const { error } = await searchParams;
  const preview = await getTripPreviewByShareToken(token);
  if (!preview) notFound();

  const user = await getCurrentUser();
  if (user && error !== "join") {
    // Finish membership + redirect in a Route Handler (safe after OAuth).
    redirect(`/api/trips/join/${token}`);
  }

  const city = destinationCity(preview.destination);
  const dates = formatInviteDateRange(preview.start_date, preview.end_date);
  const loginHref = `/login?next=${encodeURIComponent(`/api/trips/join/${token}`)}`;
  const retryHref = `/api/trips/join/${token}`;

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
              {preview.inviter_name} invited you
            </p>
            <h1 className="text-display mt-1 text-2xl font-semibold text-white">
              Pack for {city}
            </h1>
            <p className="mt-1 text-sm text-white/80">{dates}</p>
          </DestinationCover>

          <div className="space-y-5 p-6 sm:p-8">
            {error === "join" ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
                <p className="font-semibold text-destructive">Couldn&apos;t open this trip</p>
                <p className="mt-1 text-muted-foreground">
                  Your account is signed in, but joining failed. Try again — if it keeps failing,
                  ask the host to resend the link.
                </p>
              </div>
            ) : null}

            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <p className="text-display font-semibold">
                  {preview.inviter_name} invited you to pack for {city}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a free account or sign in — you&apos;ll land right on this trip&apos;s packing
                  list, weather, and day plan. Friends who got the same link can each join too.
                </p>
              </div>
            </div>

            <Button asChild size="lg" className="h-12 w-full rounded-full text-base">
              <Link href={user ? retryHref : loginHref}>
                <Luggage className="mr-2 h-4 w-4" />
                {user ? "Try joining again" : "Continue to join"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              New to {APP_NAME}? Google sign-in creates your account and opens this trip.
            </p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
