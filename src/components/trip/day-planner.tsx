"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import {
  CloudRain,
  Home,
  MapPin,
  Moon,
  Plane,
  StickyNote,
  Sun,
  CloudSun,
} from "lucide-react";
import { ActivityTag } from "@/components/design/activity-tag";
import { WeatherPreview } from "@/components/design/weather-card";
import { Textarea } from "@/components/ui/textarea";
import { updateCalendarDayNotes } from "@/actions/packing";
import type { CalendarDay, Outfit, WeatherData } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIME_ORDER: Outfit["time_of_day"][] = ["morning", "afternoon", "evening", "all_day"];

const timeIcons = {
  morning: Sun,
  afternoon: CloudSun,
  evening: Moon,
  all_day: CloudSun,
};

interface DayPlannerProps {
  tripId: string;
  startDate: string;
  endDate: string;
  destination: string;
  days: CalendarDay[];
  outfits: Outfit[];
  weather: WeatherData | null;
  notesEditable?: boolean;
}

function buildPlanningDays(
  calendarDays: CalendarDay[],
  startDate: string,
  endDate: string
): CalendarDay[] {
  if (calendarDays.length > 0) {
    return [...calendarDays].sort((a, b) => a.trip_date.localeCompare(b.trip_date));
  }

  const range = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  return range.map((date, i) => {
    const tripDate = format(date, "yyyy-MM-dd");
    const isFirst = i === 0;
    const isLast = i === range.length - 1;
    return {
      id: tripDate,
      trip_id: "",
      trip_date: tripDate,
      title: isFirst ? "Travel day" : isLast ? "Departure day" : "On the trip",
      activities: [],
      weather_summary: null,
      notes: null,
      created_at: "",
    };
  });
}

function DayWeatherBadge({
  tripDate,
  weather,
  summary,
}: {
  tripDate: string;
  weather: WeatherData | null;
  summary: string | null;
}) {
  const dayWeather = weather?.daily.find((d) => d.date === tripDate);

  if (dayWeather) {
    const rainy = dayWeather.rain_chance > 40;
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-sky-blue/10 px-3 py-2 text-sm">
        {rainy ? (
          <CloudRain className="h-4 w-4 shrink-0 text-sky-blue" />
        ) : (
          <Sun className="h-4 w-4 shrink-0 text-weather-orange" />
        )}
        <span className="font-medium">
          {dayWeather.temp_high}° / {dayWeather.temp_low}°
        </span>
        <span className="text-muted-foreground">{dayWeather.conditions}</span>
        {dayWeather.rain_chance > 25 && (
          <span className="text-xs font-medium text-sky-blue">{dayWeather.rain_chance}% rain</span>
        )}
      </div>
    );
  }

  if (summary) {
    return (
      <p className="flex items-center gap-1.5 rounded-xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
        <Sun className="h-3.5 w-3.5 shrink-0 text-sun-yellow" />
        {summary}
      </p>
    );
  }

  return null;
}

function OutfitBlock({ outfit }: { outfit: Outfit }) {
  const TimeIcon = timeIcons[outfit.time_of_day] ?? CloudSun;
  const items = outfit.items as string[];

  return (
    <div className="rounded-xl border bg-background/80 p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <TimeIcon className="h-3.5 w-3.5" />
            {outfit.time_of_day.replace("_", " ")}
          </div>
          <p className="text-display mt-0.5 font-semibold">{outfit.title}</p>
        </div>
        {outfit.activity_name && <ActivityTag name={outfit.activity_name} />}
      </div>
      {outfit.description && (
        <p className="mb-3 text-sm text-muted-foreground">{outfit.description}</p>
      )}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span
              key={i}
              className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DayNotes({
  tripId,
  dayId,
  initialNotes,
  canSave,
}: {
  tripId: string;
  dayId: string;
  initialNotes: string;
  canSave: boolean;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [, startTransition] = useTransition();

  const save = () => {
    if (!canSave || notes === initialNotes) return;
    startTransition(async () => {
      await updateCalendarDayNotes(tripId, dayId, notes);
      router.refresh();
    });
  };

  return (
    <div className="mt-4 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <StickyNote className="h-3.5 w-3.5" />
        Day notes
      </p>
      <Textarea
        placeholder="Reservations, meet-up times, reminders for this day..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        rows={2}
        className="resize-none text-sm"
        disabled={!canSave}
      />
    </div>
  );
}

export function DayPlanner({
  tripId,
  startDate,
  endDate,
  destination,
  days,
  outfits,
  weather,
  notesEditable = false,
}: DayPlannerProps) {
  const planningDays = useMemo(
    () => buildPlanningDays(days, startDate, endDate),
    [days, startDate, endDate]
  );

  const outfitsByDate = useMemo(() => {
    const map: Record<string, Outfit[]> = {};
    outfits.forEach((o) => {
      if (!map[o.trip_date]) map[o.trip_date] = [];
      map[o.trip_date].push(o);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => TIME_ORDER.indexOf(a.time_of_day) - TIME_ORDER.indexOf(b.time_of_day))
    );
    return map;
  }, [outfits]);

  if (planningDays.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Your daily plan will appear here once your packing list is built.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-muted/20 p-5">
        <p className="text-display text-lg font-semibold">What you&apos;re doing each day</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Weather, activities, outfits, and notes for {destination.split(",")[0]} — your checklist
          tracks what&apos;s packed; this is how you&apos;ll use it day by day.
        </p>
      </div>

      {weather?.daily && weather.daily.length > 0 && (
        <WeatherPreview location={weather.location ?? destination} days={weather.daily} />
      )}

      <div className="relative">
        <div className="absolute bottom-0 left-6 top-0 hidden w-0.5 bg-border sm:block" />

        <div className="space-y-5">
          {planningDays.map((day, i) => {
            const isFirst = i === 0;
            const isLast = i === planningDays.length - 1;
            const DayIcon = isFirst ? Plane : isLast ? Home : MapPin;
            const dayOutfits = outfitsByDate[day.trip_date] ?? [];
            const eventLabel = isFirst ? "Arrival" : isLast ? "Departure" : null;

            return (
              <article key={day.id} className="relative sm:pl-14">
                <div className="absolute left-4 top-6 hidden h-4 w-4 rounded-full border-2 border-primary bg-background sm:block" />

                <div className="overflow-hidden rounded-2xl border bg-card shadow-travel-sm">
                  <div className="flex flex-col lg:flex-row">
                    <div className="flex shrink-0 flex-row items-center gap-4 border-b bg-muted/30 p-5 lg:w-40 lg:flex-col lg:items-start lg:border-b-0 lg:border-r">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl",
                          isFirst && "bg-primary/15",
                          isLast && "bg-ocean-teal/15",
                          !isFirst && !isLast && "bg-muted"
                        )}
                      >
                        <DayIcon
                          className={cn(
                            "h-5 w-5",
                            isFirst && "text-primary",
                            isLast && "text-ocean-teal",
                            !isFirst && !isLast && "text-muted-foreground"
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-display font-semibold">
                          {format(parseISO(day.trip_date), "EEE")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(day.trip_date), "MMM d")}
                        </p>
                        {eventLabel && (
                          <span className="mt-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            {eventLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 p-5">
                      <h3 className="text-display text-lg font-semibold">{day.title}</h3>

                      <div className="mt-3">
                        <DayWeatherBadge
                          tripDate={day.trip_date}
                          weather={weather}
                          summary={day.weather_summary}
                        />
                      </div>

                      {(day.activities as string[]).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {(day.activities as string[]).map((activity) => (
                            <ActivityTag key={activity} name={activity} />
                          ))}
                        </div>
                      )}

                      {dayOutfits.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            What to wear
                          </p>
                          {dayOutfits.map((outfit) => (
                            <OutfitBlock key={outfit.id} outfit={outfit} />
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-muted-foreground">
                          No outfit suggestions for this day yet — check your checklist for
                          activity gear.
                        </p>
                      )}

                      <DayNotes
                        tripId={tripId}
                        dayId={day.id}
                        initialNotes={day.notes ?? ""}
                        canSave={notesEditable}
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
