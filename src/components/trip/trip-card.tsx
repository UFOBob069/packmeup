import { differenceInDays, format, parseISO } from "date-fns";
import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { ProgressRing } from "@/components/design/progress-ring";
import { TravelerAvatarGroup } from "@/components/design/traveler-avatar";
import { CountdownWidget } from "@/components/design/countdown-widget";
import { ActivityTag } from "@/components/design/activity-tag";
import { DestinationCover } from "./destination-cover";
import type { Trip, PackingItem, Traveler, Activity, WeatherData } from "@/lib/types";
import { calculateProgress } from "@/lib/demo/store";
import { getWeatherSnapshot } from "@/lib/design-system";
import { cn } from "@/lib/utils";
import { CloudRain, Sun } from "lucide-react";

interface TripCardProps {
  trip: Trip;
  travelers?: Traveler[];
  packingItems?: PackingItem[];
  activities?: Activity[];
  weather?: WeatherData | null;
  featured?: boolean;
}

export function TripCard({
  trip,
  travelers = [],
  packingItems = [],
  activities = [],
  weather = null,
  featured,
}: TripCardProps) {
  const daysUntil = differenceInDays(parseISO(trip.start_date), new Date());
  const isPast = daysUntil < 0 && trip.end_date < new Date().toISOString().split("T")[0];
  const progress = calculateProgress(packingItems, travelers);
  const tripActivities = activities.slice(0, 3).map((a) => a.activity_name);
  const weatherSnap = !isPast ? getWeatherSnapshot(weather) : null;
  const statusLabel = isPast ? "Past list" : daysUntil <= 7 ? "Pack soon" : "Upcoming";

  return (
    <Link href={`/trips/${trip.id}`} className="group block">
      <article
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-card transition-all duration-300",
          "hover:-translate-y-1 hover:shadow-travel",
          featured && "border-primary/20 shadow-travel-sm"
        )}
      >
        <DestinationCover
          destination={trip.destination}
          coverImageUrl={trip.cover_image_url}
          variant="card"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-white/80">
              {statusLabel}
            </p>
            <h3 className="text-display mt-1 truncate text-xl font-semibold tracking-tight text-white">
              {trip.destination}
            </h3>
          </div>
        </DestinationCover>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {format(parseISO(trip.start_date), "MMM d")} –{" "}
              {format(parseISO(trip.end_date), "MMM d, yyyy")}
            </p>
            {!isPast && packingItems.length > 0 && (
              <ProgressRing value={progress.percentage} size={56} strokeWidth={4} />
            )}
          </div>

          {!isPast && daysUntil >= 0 && (
            <div className="mt-4">
              <CountdownWidget days={daysUntil} compact className="border-0 bg-muted/50 p-3" />
            </div>
          )}

          {weatherSnap && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-sky-blue/10 px-3 py-2.5 text-sm">
              {weatherSnap.rainChance > 40 ? (
                <CloudRain className="h-4 w-4 shrink-0 text-sky-blue" />
              ) : (
                <Sun className="h-4 w-4 shrink-0 text-weather-orange" />
              )}
              <span className="font-medium">{weatherSnap.avgHigh}° avg</span>
              <span className="text-muted-foreground">· {weatherSnap.conditions}</span>
              {weatherSnap.rainChance > 30 && (
                <span className="ml-auto text-xs font-medium text-sky-blue">
                  {weatherSnap.rainChance}% rain
                </span>
              )}
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
