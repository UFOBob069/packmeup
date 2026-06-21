import { differenceInDays, format, parseISO } from "date-fns";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { ProgressRing } from "@/components/design/progress-ring";
import { TravelerAvatarGroup } from "@/components/design/traveler-avatar";
import { CountdownWidget } from "@/components/design/countdown-widget";
import { ActivityTag } from "@/components/design/activity-tag";
import type { Trip, PackingItem, Traveler, Activity } from "@/lib/types";
import { calculateProgress } from "@/lib/demo/store";
import { cn } from "@/lib/utils";

interface TripCardProps {
  trip: Trip;
  travelers?: Traveler[];
  packingItems?: PackingItem[];
  activities?: Activity[];
  featured?: boolean;
}

export function TripCard({
  trip,
  travelers = [],
  packingItems = [],
  activities = [],
  featured,
}: TripCardProps) {
  const daysUntil = differenceInDays(parseISO(trip.start_date), new Date());
  const isPast = daysUntil < 0 && trip.end_date < new Date().toISOString().split("T")[0];
  const progress = calculateProgress(packingItems, travelers);
  const tripActivities = activities.slice(0, 3).map((a) => a.activity_name);

  return (
    <Link href={`/trips/${trip.id}`} className="group block">
      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-card transition-all duration-300",
          "hover:-translate-y-1 hover:shadow-travel",
          featured && "border-primary/20 shadow-travel-sm"
        )}
      >
        {/* Gradient header strip */}
        <div className="h-2 bg-gradient-to-r from-primary via-sky-blue to-ocean-teal" />

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isPast ? "Past list" : daysUntil <= 7 ? "Pack soon" : "Upcoming"}
              </p>
              <h3 className="text-display mt-1 truncate text-xl font-semibold tracking-tight group-hover:text-primary">
                {trip.destination}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {format(parseISO(trip.start_date), "MMM d")} –{" "}
                {format(parseISO(trip.end_date), "MMM d, yyyy")}
              </p>
            </div>
            {!isPast && packingItems.length > 0 && (
              <ProgressRing value={progress.percentage} size={64} strokeWidth={5} />
            )}
          </div>

          {!isPast && daysUntil >= 0 && (
            <div className="mt-4">
              <CountdownWidget days={daysUntil} compact className="border-0 bg-muted/50 p-3" />
            </div>
          )}

          {travelers.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <TravelerAvatarGroup
                travelers={travelers.map((t) => ({
                  name: t.name,
                  traveler_type: t.traveler_type,
                }))}
              />
              <span className="text-xs text-muted-foreground">
                {progress.packed}/{progress.total} packed
              </span>
            </div>
          )}

          {tripActivities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tripActivities.map((name) => (
                <ActivityTag key={name} name={name} />
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-end text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            View packing list
            <ChevronRight className="ml-0.5 h-4 w-4" />
          </div>
        </div>
      </article>
    </Link>
  );
}
