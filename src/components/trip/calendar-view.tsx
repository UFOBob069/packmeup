import { format, parseISO } from "date-fns";
import { Sun, Plane, Home } from "lucide-react";
import { ActivityTag } from "@/components/design/activity-tag";
import type { CalendarDay, Outfit } from "@/lib/types";

interface CalendarViewProps {
  days: CalendarDay[];
  outfits: Outfit[];
}

export function CalendarView({ days, outfits }: CalendarViewProps) {
  if (days.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Your travel timeline will appear here once your trip is planned.
      </p>
    );
  }

  const outfitsByDate = outfits.reduce(
    (acc, o) => {
      if (!acc[o.trip_date]) acc[o.trip_date] = [];
      acc[o.trip_date].push(o);
      return acc;
    },
    {} as Record<string, Outfit[]>
  );

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute bottom-0 left-6 top-0 hidden w-0.5 bg-border sm:block" />

      <div className="space-y-4">
        {days.map((day, i) => {
          const isFirst = i === 0;
          const isLast = i === days.length - 1;
          const DayIcon = isFirst ? Plane : isLast ? Home : Sun;

          return (
            <article
              key={day.id}
              className="relative sm:pl-14"
            >
              {/* Timeline dot */}
              <div className="absolute left-4 top-6 hidden h-4 w-4 rounded-full border-2 border-primary bg-background sm:block" />

              <div className="overflow-hidden rounded-2xl border bg-card shadow-travel-sm transition-all hover:shadow-travel">
                <div className="flex flex-col sm:flex-row">
                  {/* Date column */}
                  <div className="flex shrink-0 flex-row items-center gap-4 border-b bg-muted/30 p-5 sm:w-36 sm:flex-col sm:items-start sm:border-b-0 sm:border-r">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <DayIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-display font-semibold">
                        {format(parseISO(day.trip_date), "EEE")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(day.trip_date), "MMM d")}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5">
                    <h4 className="text-display text-lg font-semibold">{day.title}</h4>
                    {day.weather_summary && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Sun className="h-3.5 w-3.5 text-sun-yellow" />
                        {day.weather_summary}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(day.activities as string[]).map((activity) => (
                        <ActivityTag key={activity} name={activity} />
                      ))}
                    </div>

                    {outfitsByDate[day.trip_date]?.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Outfits
                        </p>
                        {outfitsByDate[day.trip_date].map((outfit) => (
                          <div
                            key={outfit.id}
                            className="rounded-xl border bg-background/80 p-3"
                          >
                            <p className="text-sm font-medium">{outfit.title}</p>
                            <p className="text-xs capitalize text-muted-foreground">
                              {outfit.time_of_day.replace("_", " ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
