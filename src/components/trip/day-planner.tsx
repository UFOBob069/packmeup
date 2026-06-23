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
  Plus,
  StickyNote,
  Sun,
  CloudSun,
  Trash2,
} from "lucide-react";
import { ActivityTag } from "@/components/design/activity-tag";
import { WeatherPreview } from "@/components/design/weather-card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createOutfit,
  deleteOutfit,
  saveCalendarDayTitle,
  updateCalendarDayNotes,
  updateOutfit,
} from "@/actions/packing";
import { OutfitItemsPicker } from "@/components/trip/outfit-items-picker";
import { normalizeOutfitItems } from "@/lib/outfit-items";
import type { CalendarDay, GearItem, Outfit, WeatherData } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIME_ORDER: Outfit["time_of_day"][] = ["morning", "afternoon", "evening", "all_day"];

const TIME_LABELS: Record<Outfit["time_of_day"], string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  all_day: "All day",
};

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
  gearItems: GearItem[];
  editable?: boolean;
}

function buildPlanningDays(
  calendarDays: CalendarDay[],
  startDate: string,
  endDate: string
): CalendarDay[] {
  const range = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });

  const byDate = new Map(calendarDays.map((d) => [d.trip_date, d]));

  return range.map((date, i) => {
    const tripDate = format(date, "yyyy-MM-dd");
    const existing = byDate.get(tripDate);
    if (existing) return existing;

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

function isPersistedCalendarDay(day: CalendarDay): boolean {
  return Boolean(day.trip_id && day.id && !/^\d{4}-\d{2}-\d{2}$/.test(day.id));
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

function DayTitle({
  tripId,
  day,
  editable,
}: {
  tripId: string;
  day: CalendarDay;
  editable: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(day.title);
  const [, startTransition] = useTransition();

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === day.title) return;
    startTransition(async () => {
      await saveCalendarDayTitle(
        tripId,
        day.trip_date,
        trimmed,
        isPersistedCalendarDay(day) ? day.id : undefined
      );
      router.refresh();
    });
  };

  if (!editable) {
    return <h3 className="text-display text-lg font-semibold">{day.title}</h3>;
  }

  return (
    <Input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
      className="text-display h-auto border-transparent bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:border-border focus-visible:bg-background focus-visible:px-3"
      aria-label="Day title"
    />
  );
}

function OutfitBlock({
  tripId,
  outfit,
  gearItems,
  editable,
  tripActivities,
}: {
  tripId: string;
  outfit: Outfit;
  gearItems: GearItem[];
  editable: boolean;
  tripActivities: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(outfit.title);
  const [description, setDescription] = useState(outfit.description);
  const [activityName, setActivityName] = useState(outfit.activity_name ?? "");
  const [timeOfDay, setTimeOfDay] = useState(outfit.time_of_day);
  const [, startTransition] = useTransition();

  const TimeIcon = timeIcons[outfit.time_of_day] ?? CloudSun;
  const filterHint = outfit.activity_name ?? outfit.title;

  const saveField = (updates: Parameters<typeof updateOutfit>[2]) => {
    startTransition(async () => {
      await updateOutfit(tripId, outfit.id, updates);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteOutfit(tripId, outfit.id);
      router.refresh();
    });
  };

  if (!editable) {
    const items = normalizeOutfitItems(outfit.items);
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
                {item.name}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-background/80 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <TimeIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={timeOfDay}
              onChange={(e) => {
                const value = e.target.value as Outfit["time_of_day"];
                setTimeOfDay(value);
                saveField({ time_of_day: value });
              }}
              className="h-7 cursor-pointer rounded-lg border border-muted-foreground/20 bg-background px-2 text-xs font-medium uppercase tracking-wider"
            >
              {TIME_ORDER.map((t) => (
                <option key={t} value={t}>
                  {TIME_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() && title !== outfit.title) {
                saveField({ title });
              }
            }}
            placeholder="Event name"
            className="text-display h-8 font-semibold"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          className="shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
          aria-label="Delete event"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => {
          if (description !== outfit.description) {
            saveField({ description });
          }
        }}
        placeholder="What are you doing? e.g. Golf shirt and shorts for a day on the course."
        rows={2}
        className="mb-3 resize-none text-sm"
      />

      <div className="mb-3">
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Activity tag
        </label>
        <Input
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          onBlur={() => {
            const next = activityName.trim() || null;
            if (next !== outfit.activity_name) {
              saveField({ activity_name: next });
            }
          }}
          placeholder="e.g. Golf"
          list={tripActivities.length > 0 ? `activities-${outfit.id}` : undefined}
          className="h-8 text-sm"
        />
        {tripActivities.length > 0 && (
          <datalist id={`activities-${outfit.id}`}>
            {tripActivities.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        )}
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          What to wear / bring
        </p>
        <OutfitItemsPicker
          tripId={tripId}
          outfitId={outfit.id}
          items={outfit.items}
          gearItems={gearItems}
          filterHint={filterHint}
          activityName={outfit.activity_name}
        />
      </div>
    </div>
  );
}

function DayNotes({
  tripId,
  day,
  canSave,
}: {
  tripId: string;
  day: CalendarDay;
  canSave: boolean;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(day.notes ?? "");
  const [, startTransition] = useTransition();

  const save = () => {
    if (!canSave || notes === (day.notes ?? "")) return;
    startTransition(async () => {
      await updateCalendarDayNotes(
        tripId,
        day.id,
        notes,
        isPersistedCalendarDay(day) ? undefined : day.trip_date
      );
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

function AddEventButton({
  tripId,
  tripDate,
  defaultActivity,
}: {
  tripId: string;
  tripDate: string;
  defaultActivity?: string | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleAdd = () => {
    startTransition(async () => {
      await createOutfit(tripId, {
        trip_date: tripDate,
        time_of_day: "all_day",
        title: defaultActivity ? `${defaultActivity} event` : "New event",
        activity_name: defaultActivity ?? null,
        items: [],
      });
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleAdd}
      className="mt-3 cursor-pointer rounded-full"
    >
      <Plus className="mr-1.5 h-3.5 w-3.5" />
      Add event
    </Button>
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
  gearItems,
  editable = true,
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

  const tripActivities = useMemo(() => {
    const set = new Set<string>();
    planningDays.forEach((d) => (d.activities as string[]).forEach((a) => set.add(a)));
    outfits.forEach((o) => {
      if (o.activity_name) set.add(o.activity_name);
    });
    return Array.from(set);
  }, [planningDays, outfits]);

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
          Edit day names, add events, and pick gear for each day. Your checklist tracks
          what&apos;s packed — this is how you&apos;ll use it day by day.
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
            const dayActivities = day.activities as string[];
            const defaultActivity = dayActivities[0] ?? null;

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
                      <DayTitle tripId={tripId} day={day} editable={editable} />

                      <div className="mt-3">
                        <DayWeatherBadge
                          tripDate={day.trip_date}
                          weather={weather}
                          summary={day.weather_summary}
                        />
                      </div>

                      {dayActivities.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {dayActivities.map((activity) => (
                            <ActivityTag key={activity} name={activity} />
                          ))}
                        </div>
                      )}

                      <div className="mt-4 space-y-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Events & outfits
                        </p>
                        {dayOutfits.length > 0 ? (
                          dayOutfits.map((outfit) => (
                            <OutfitBlock
                              key={outfit.id}
                              tripId={tripId}
                              outfit={outfit}
                              gearItems={gearItems}
                              editable={editable}
                              tripActivities={tripActivities}
                            />
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No events yet — add one to plan what to wear or bring.
                          </p>
                        )}
                        {editable && (
                          <AddEventButton
                            tripId={tripId}
                            tripDate={day.trip_date}
                            defaultActivity={defaultActivity}
                          />
                        )}
                      </div>

                      <DayNotes
                        tripId={tripId}
                        day={day}
                        canSave={editable}
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
