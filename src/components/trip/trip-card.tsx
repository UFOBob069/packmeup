import { differenceInDays, format, parseISO } from "date-fns";
import Link from "next/link";
import { MapPin, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Trip, PackingItem, Traveler } from "@/lib/types";
import { calculateProgress } from "@/lib/demo/store";

interface TripCardProps {
  trip: Trip;
  travelers?: Traveler[];
  packingItems?: PackingItem[];
  isShared?: boolean;
}

export function TripCard({ trip, travelers = [], packingItems = [], isShared }: TripCardProps) {
  const daysUntil = differenceInDays(parseISO(trip.start_date), new Date());
  const isPast = daysUntil < 0;
  const progress = calculateProgress(packingItems, travelers);

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="group transition-all hover:border-primary/30 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold leading-tight group-hover:text-primary">
                {trip.destination}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {format(parseISO(trip.start_date), "MMM d")} –{" "}
                {format(parseISO(trip.end_date), "MMM d, yyyy")}
              </p>
            </div>
            {isShared && <Badge variant="secondary">Shared</Badge>}
            {!isPast && daysUntil >= 0 && (
              <Badge variant={daysUntil <= 7 ? "default" : "outline"}>
                {daysUntil === 0 ? "Today!" : `${daysUntil}d`}
              </Badge>
            )}
            {isPast && <Badge variant="secondary">Past</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {travelers.length || 1} traveler{travelers.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {trip.travel_type.replace(/_/g, " ")}
            </span>
          </div>
          {packingItems.length > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Packing progress</span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
