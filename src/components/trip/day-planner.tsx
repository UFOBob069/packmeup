"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import {
  Backpack,
  Check,
  ChevronDown,
  CloudRain,
  Footprints,
  Home,
  MapPin,
  Moon,
  Pencil,
  Plane,
  Plus,
  Shirt,
  Sparkles,
  StickyNote,
  Sun,
  CloudSun,
  Trash2,
} from "lucide-react";
import { ActivityTag } from "@/components/design/activity-tag";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createOutfit,
  deleteOutfit,
  saveCalendarDayActivities,
  saveCalendarDayTitle,
  updateCalendarDayNotes,
  updateOutfit,
} from "@/actions/packing";
import { OutfitItemsPicker } from "@/components/trip/outfit-items-picker";
import { normalizeOutfitItems } from "@/lib/outfit-items";
import type {
  CalendarDay,
  GearItem,
  Outfit,
  OutfitItem,
  PackingCategory,
  WeatherData,
  WeatherDay,
} from "@/lib/types";
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

type DayMode = "collapsed" | "view" | "edit";

interface DayPlannerProps {
  tripId: string;
  startDate: string;
  endDate: string;
  destination: string;
  days: CalendarDay[];
  outfits: Outfit[];
  weather: WeatherData | null;
  gearItems: GearItem[];
  tripActivities?: string[];
  focusedDate?: string | null;
  onFocusedDate?: () => void;
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

function outfitItemIcon(category?: PackingCategory | null) {
  if (category === "shoes") return Footprints;
  if (category === "activity_gear") return Backpack;
  if (category === "clothing") return Shirt;
  return Check;
}

function getDayWeather(tripDate: string, weather: WeatherData | null): WeatherDay | null {
  return weather?.daily.find((d) => d.date === tripDate) ?? null;
}

function uniqueOutfitItems(outfits: Outfit[]): OutfitItem[] {
  const seen = new Set<string>();
  const items: OutfitItem[] = [];
  for (const outfit of outfits) {
    for (const item of normalizeOutfitItems(outfit.items)) {
      const key = item.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
  }
  return items;
}

function dayAiTips(weather: WeatherDay | null): string[] {
  if (!weather) return [];
  const tips: string[] = [];
  if (weather.rain_chance >= 40 || /rain|shower|drizzle|thunder/i.test(weather.conditions)) {
    tips.push("Rain jacket");
    tips.push("Waterproof shoes");
  }
  if (weather.temp_high >= 85) {
    tips.push("Cooling towel");
    tips.push("Extra water");
  }
  if (weather.temp_low <= 55) tips.push("Light evening layer");
  return [...new Set(tips)].slice(0, 3);
}

function WeatherLine({ day }: { day: WeatherDay | null }) {
  if (!day) return null;
  const rainy =
    day.rain_chance >= 45 || /rain|shower|drizzle|thunder/i.test(day.conditions);
  const Icon = rainy ? CloudRain : Sun;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted-foreground">
      <Icon className={cn("h-4 w-4", rainy ? "text-sky-blue" : "text-weather-orange")} />
      <span className="font-medium text-foreground">
        {day.temp_high}° / {day.temp_low}°
      </span>
      <span>{day.conditions.replace(/^Typical ·\s*/i, "")}</span>
    </p>
  );
}

function DayTitleEditor({ tripId, day }: { tripId: string; day: CalendarDay }) {
  const router = useRouter();
  const [title, setTitle] = useState(day.title);
  const [, startTransition] = useTransition();

  useEffect(() => setTitle(day.title), [day.title]);

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

  return (
    <Input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className="text-display h-auto border-transparent bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:border-border focus-visible:bg-background focus-visible:px-3"
      aria-label="Day title"
    />
  );
}

function OutfitEditBlock({
  tripId,
  outfit,
  gearItems,
  tripActivities,
}: {
  tripId: string;
  outfit: Outfit;
  gearItems: GearItem[];
  tripActivities: string[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(outfit.title);
  const [description, setDescription] = useState(outfit.description);
  const [activityName, setActivityName] = useState(outfit.activity_name ?? "");
  const [timeOfDay, setTimeOfDay] = useState(outfit.time_of_day);
  const [, startTransition] = useTransition();
  const TimeIcon = timeIcons[outfit.time_of_day] ?? CloudSun;

  useEffect(() => {
    setTitle(outfit.title);
    setDescription(outfit.description);
    setActivityName(outfit.activity_name ?? "");
    setTimeOfDay(outfit.time_of_day);
  }, [outfit]);

  const saveField = (updates: Parameters<typeof updateOutfit>[2]) => {
    startTransition(async () => {
      await updateOutfit(tripId, outfit.id, updates);
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border bg-background p-4">
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
              className="h-7 cursor-pointer rounded-lg border bg-background px-2 text-xs font-medium uppercase tracking-wider"
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
              if (title.trim() && title !== outfit.title) saveField({ title });
            }}
            placeholder="Event name"
            className="text-display h-8 font-semibold"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            startTransition(async () => {
              await deleteOutfit(tripId, outfit.id);
              router.refresh();
            })
          }
          className="text-muted-foreground hover:text-destructive"
          aria-label="Delete event"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => {
          if (description !== outfit.description) saveField({ description });
        }}
        placeholder="Tee time, address, who you're with…"
        rows={2}
        className="mb-3 resize-none text-sm"
      />

      <div className="mb-3 space-y-1.5">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Event tag
        </label>
        <Input
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          onBlur={() => {
            const next = activityName.trim() || null;
            if (next !== outfit.activity_name) saveField({ activity_name: next });
          }}
          placeholder="e.g. Golf, Hike, Dinner…"
          className="h-8 text-sm"
        />
        {tripActivities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tripActivities.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setActivityName(a);
                  saveField({ activity_name: a });
                }}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium",
                  activityName === a
                    ? "border-primary bg-primary/10 text-primary"
                    : "bg-muted/40 hover:bg-muted"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          From your closet
        </p>
        <OutfitItemsPicker
          tripId={tripId}
          outfitId={outfit.id}
          items={outfit.items}
          gearItems={gearItems}
          filterHint={outfit.activity_name ?? outfit.title}
          activityName={outfit.activity_name}
        />
      </div>
    </div>
  );
}

function DayActivitiesEditor({
  tripId,
  day,
  suggestions,
}: {
  tripId: string;
  day: CalendarDay;
  suggestions: string[];
}) {
  const router = useRouter();
  const [tags, setTags] = useState((day.activities as string[]) ?? []);
  const [draft, setDraft] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => setTags((day.activities as string[]) ?? []), [day.activities]);

  const persist = (next: string[]) => {
    setTags(next);
    startTransition(async () => {
      await saveCalendarDayActivities(
        tripId,
        day.trip_date,
        next,
        isPersistedCalendarDay(day) ? day.id : undefined
      );
      router.refresh();
    });
  };

  const unused = suggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Day tags
      </p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((activity) => (
            <span key={activity} className="inline-flex items-center gap-1">
              <ActivityTag name={activity} />
              <button
                type="button"
                onClick={() => persist(tags.filter((t) => t !== activity))}
                className="rounded-full p-0.5 text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${activity}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. Golf, Beach…"
          className="h-8 flex-1 text-sm"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const trimmed = draft.trim();
            if (!trimmed || tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
            persist([...tags, trimmed]);
            setDraft("");
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!draft.trim()}
          onClick={() => {
            const trimmed = draft.trim();
            if (!trimmed) return;
            persist([...tags, trimmed]);
            setDraft("");
          }}
          className="h-8 rounded-full"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => persist([...tags, s])}
              className="rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EventViewCard({ outfit }: { outfit: Outfit }) {
  const TimeIcon = timeIcons[outfit.time_of_day] ?? CloudSun;
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <TimeIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {TIME_LABELS[outfit.time_of_day]}
          </p>
          <p className="text-display font-semibold">{outfit.title}</p>
          {outfit.activity_name && (
            <p className="mt-0.5 text-sm text-muted-foreground">{outfit.activity_name}</p>
          )}
          {outfit.description && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {outfit.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DayCard({
  tripId,
  day,
  index,
  total,
  outfits,
  weather,
  gearItems,
  tripActivities,
  mode,
  canEdit,
  onModeChange,
}: {
  tripId: string;
  day: CalendarDay;
  index: number;
  total: number;
  outfits: Outfit[];
  weather: WeatherData | null;
  gearItems: GearItem[];
  tripActivities: string[];
  mode: DayMode;
  canEdit: boolean;
  onModeChange: (mode: DayMode) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [notes, setNotes] = useState(day.notes ?? "");

  useEffect(() => setNotes(day.notes ?? ""), [day.notes]);

  const isFirst = index === 0;
  const isLast = index === total - 1;
  const DayIcon = isFirst ? Plane : isLast ? Home : MapPin;
  const eventLabel = isFirst ? "Arrival" : isLast ? "Departure" : null;
  const weatherDay = getDayWeather(day.trip_date, weather);
  const dayActivities = (day.activities as string[]) ?? [];
  const planLabel = [eventLabel, ...dayActivities].filter(Boolean).join(" + ") || day.title;
  const items = uniqueOutfitItems(outfits);
  const tips = dayAiTips(weatherDay);
  const defaultActivity = dayActivities[0] ?? null;

  const saveNotes = () => {
    if (!canEdit || notes === (day.notes ?? "")) return;
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

  if (mode === "collapsed") {
    return (
      <article
        id={`trip-day-${day.trip_date}`}
        tabIndex={-1}
        className="scroll-mt-24 outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <button
          type="button"
          onClick={() => onModeChange("view")}
          className="flex w-full items-start gap-4 rounded-2xl border bg-card p-4 text-left shadow-travel-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-travel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
        >
          <span
            className={cn(
              "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              isFirst && "bg-primary/15 text-primary",
              isLast && "bg-ocean-teal/15 text-ocean-teal",
              !isFirst && !isLast && "bg-muted text-muted-foreground"
            )}
          >
            <DayIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-display text-lg font-semibold">
                  {format(parseISO(day.trip_date), "EEEE")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(day.trip_date), "MMM d")}
                </p>
              </div>
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <WeatherLine day={weatherDay} />
            </div>
            <p className="mt-2 text-sm font-medium">{planLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {[
                outfits.length > 0 &&
                  `${outfits.length} event${outfits.length === 1 ? "" : "s"}`,
                items.length > 0 && `${items.length} to pack`,
                tips.length > 0 && `${tips.length} suggestion${tips.length === 1 ? "" : "s"}`,
                day.notes && "Notes",
              ]
                .filter(Boolean)
                .join(" · ") || "Tap to open"}
            </p>
          </div>
        </button>
      </article>
    );
  }

  return (
    <article
      id={`trip-day-${day.trip_date}`}
      tabIndex={-1}
      className="scroll-mt-24 overflow-hidden rounded-2xl border bg-card shadow-travel-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="flex items-start justify-between gap-3 border-b bg-muted/20 px-5 py-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => onModeChange("collapsed")}
            className="group flex items-center gap-2 text-left"
          >
            <p className="text-display text-xl font-semibold">
              {format(parseISO(day.trip_date), "EEEE")}
            </p>
            <ChevronDown className="h-4 w-4 rotate-180 text-muted-foreground transition group-hover:text-foreground" />
          </button>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(day.trip_date), "MMMM d")}
            {eventLabel ? ` · ${eventLabel}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {canEdit && mode === "view" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onModeChange("edit")}
              className="rounded-full"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit day
            </Button>
          )}
          {canEdit && mode === "edit" && (
            <Button
              type="button"
              size="sm"
              onClick={() => onModeChange("view")}
              className="rounded-full"
            >
              Done
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {mode === "view" ? (
          <>
            <div className="space-y-2">
              <h3 className="text-display text-lg font-semibold">{day.title}</h3>
              <WeatherLine day={weatherDay} />
              {(eventLabel || dayActivities.length > 0) && (
                <p className="text-sm font-medium text-foreground/90">
                  {[eventLabel, ...dayActivities].filter(Boolean).join(" + ")}
                </p>
              )}
            </div>

            {outfits.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-display text-sm font-semibold">Today&apos;s plans</h4>
                <div className="space-y-3">
                  {outfits.map((outfit) => (
                    <EventViewCard key={outfit.id} outfit={outfit} />
                  ))}
                </div>
              </section>
            )}

            {items.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-display text-sm font-semibold">Today&apos;s outfit</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((item, i) => {
                    const Icon = outfitItemIcon(item.category);
                    return (
                      <div
                        key={`${item.name}-${i}`}
                        className="flex items-center gap-3 rounded-2xl border bg-muted/20 px-3 py-3"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-primary shadow-travel-sm">
                          <Icon className="h-5 w-5" />
                        </span>
                        <p className="text-sm font-medium leading-snug">{item.name}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {items.length > 0 && (
              <section className="space-y-3">
                <h4 className="text-display text-sm font-semibold">Pack today</h4>
                <ul className="space-y-2">
                  {items.map((item, i) => (
                    <li
                      key={`${item.name}-pack-${i}`}
                      className="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded border border-muted-foreground/25">
                        <Check className="h-3 w-3 text-golf-green opacity-40" />
                      </span>
                      {item.name}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <AiTips tips={tips} />

            {day.notes && (
              <section className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-display text-sm font-semibold">
                  <StickyNote className="h-3.5 w-3.5" />
                  Notes
                </h4>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {day.notes}
                </p>
              </section>
            )}

            {!outfits.length && !items.length && !day.notes && tips.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing planned for this day yet
                {canEdit ? " — tap Edit day to add events and what to wear." : "."}
              </p>
            )}
          </>
        ) : (
          <>
            <DayTitleEditor tripId={tripId} day={day} />
            <WeatherLine day={weatherDay} />
            <DayActivitiesEditor tripId={tripId} day={day} suggestions={tripActivities} />

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-display text-sm font-semibold">Events</h4>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    startTransition(async () => {
                      await createOutfit(tripId, {
                        trip_date: day.trip_date,
                        time_of_day: "all_day",
                        title: defaultActivity ? `${defaultActivity} event` : "New event",
                        activity_name: defaultActivity,
                        items: [],
                      });
                      router.refresh();
                    })
                  }
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add event
                </Button>
              </div>
              {outfits.length > 0 ? (
                outfits.map((outfit) => (
                  <OutfitEditBlock
                    key={outfit.id}
                    tripId={tripId}
                    outfit={outfit}
                    gearItems={gearItems}
                    tripActivities={tripActivities}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add an event to plan what to wear and bring.
                </p>
              )}
            </section>

            <section className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <StickyNote className="h-3.5 w-3.5" />
                Notes
              </p>
              <Textarea
                placeholder="Reservations, meet-up times, reminders…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                rows={3}
                className="resize-none text-sm"
              />
            </section>

            <AiTips tips={tips} />
          </>
        )}
      </div>
    </article>
  );
}

function AiTips({ tips }: { tips: string[] }) {
  if (tips.length === 0) return null;
  return (
    <section className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Suggestions for this day</h4>
      </div>
      <ul className="mt-3 space-y-1.5">
        {tips.map((tip) => (
          <li key={tip} className="text-sm text-muted-foreground">
            + {tip}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DayPlanner({
  tripId,
  startDate,
  endDate,
  destination: _destination,
  days,
  outfits,
  weather,
  gearItems,
  tripActivities: configuredActivities = [],
  focusedDate,
  onFocusedDate,
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
    const set = new Set<string>(configuredActivities);
    planningDays.forEach((d) => (d.activities as string[]).forEach((a) => set.add(a)));
    outfits.forEach((o) => {
      if (o.activity_name) set.add(o.activity_name);
    });
    return Array.from(set);
  }, [configuredActivities, planningDays, outfits]);

  const [dayModes, setDayModes] = useState<Record<string, DayMode>>({});

  const getMode = (date: string): DayMode => dayModes[date] ?? "collapsed";
  const setMode = (date: string, mode: DayMode) =>
    setDayModes((prev) => ({ ...prev, [date]: mode }));

  useEffect(() => {
    if (!focusedDate) return;
    setMode(focusedDate, "view");
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(`trip-day-${focusedDate}`);
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.focus({ preventScroll: true });
      onFocusedDate?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [focusedDate, onFocusedDate]);

  if (planningDays.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Your daily plan will appear here once your trip dates are set.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-muted/20 p-5">
        <p className="text-display text-lg font-semibold">By day</p>
        <p className="mt-1 text-sm text-muted-foreground">
          A clean look at each day of the trip. Tap a day to open it — edit only when you need
          to change plans.
        </p>
      </div>

      <div className="space-y-3">
        {planningDays.map((day, i) => (
          <DayCard
            key={day.id}
            tripId={tripId}
            day={day}
            index={i}
            total={planningDays.length}
            outfits={outfitsByDate[day.trip_date] ?? []}
            weather={weather}
            gearItems={gearItems}
            tripActivities={tripActivities}
            mode={getMode(day.trip_date)}
            canEdit={editable}
            onModeChange={(mode) => setMode(day.trip_date, mode)}
          />
        ))}
      </div>
    </div>
  );
}
