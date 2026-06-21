import { format, parseISO } from "date-fns";
import { Sun, Moon, CloudSun } from "lucide-react";
import { ActivityTag } from "@/components/design/activity-tag";
import { EmptyOutfits } from "@/components/design/empty-state";
import type { Outfit } from "@/lib/types";
import { cn } from "@/lib/utils";

const timeIcons = {
  morning: Sun,
  afternoon: CloudSun,
  evening: Moon,
  all_day: CloudSun,
};

interface OutfitPlannerProps {
  outfits: Outfit[];
}

export function OutfitPlanner({ outfits }: OutfitPlannerProps) {
  if (outfits.length === 0) return <EmptyOutfits />;

  const byDate = outfits.reduce(
    (acc, outfit) => {
      if (!acc[outfit.trip_date]) acc[outfit.trip_date] = [];
      acc[outfit.trip_date].push(outfit);
      return acc;
    },
    {} as Record<string, Outfit[]>
  );

  return (
    <div className="space-y-8">
      {Object.entries(byDate).map(([date, dayOutfits]) => (
        <div key={date}>
          <h3 className="text-display mb-4 text-lg font-semibold">
            {format(parseISO(date), "EEEE, MMMM d")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {dayOutfits.map((outfit) => {
              const TimeIcon = timeIcons[outfit.time_of_day] ?? CloudSun;
              const items = outfit.items as string[];

              return (
                <article
                  key={outfit.id}
                  className="group overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-travel-sm"
                >
                  <div className="h-1.5 bg-gradient-to-r from-primary/60 via-sky-blue/60 to-warm-sand/80" />
                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          <TimeIcon className="h-3.5 w-3.5" />
                          {outfit.time_of_day.replace("_", " ")}
                        </div>
                        <h4 className="text-display mt-1 text-lg font-semibold">{outfit.title}</h4>
                      </div>
                      {outfit.activity_name && <ActivityTag name={outfit.activity_name} />}
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">{outfit.description}</p>
                    <div className="space-y-2">
                      {items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5 transition-colors group-hover:bg-muted/70"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-sm shadow-sm">
                            {i === 0 ? "👕" : i === items.length - 1 ? "👟" : "🧢"}
                          </div>
                          <span className="text-sm font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
