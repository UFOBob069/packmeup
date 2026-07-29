import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Pencil, Plus, Shirt, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { CalendarDay, Outfit, OutfitItem } from "../types";

type DayMode = "collapsed" | "view" | "edit";

interface DayPlanSectionProps {
  tripId: string;
  userId: string;
  startDate: string;
  endDate: string;
  calendarDays: CalendarDay[];
  outfits: Outfit[];
  onChanged: () => Promise<void> | void;
  onError: (message: string) => void;
}

function formatDay(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, options);
}

function eachTripDate(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function isPersistedDay(day: CalendarDay) {
  return Boolean(day.trip_id && day.id && !/^\d{4}-\d{2}-\d{2}$/.test(day.id));
}

function normalizeItems(items: Outfit["items"]): OutfitItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => (typeof item === "string" ? { name: item } : item));
}

function buildPlanningDays(
  calendarDays: CalendarDay[],
  startDate: string,
  endDate: string
): CalendarDay[] {
  const byDate = new Map(calendarDays.map((day) => [day.trip_date, day]));
  const range = eachTripDate(startDate, endDate);

  return range.map((tripDate, index) => {
    const existing = byDate.get(tripDate);
    if (existing) return existing;
    const isFirst = index === 0;
    const isLast = index === range.length - 1;
    return {
      id: tripDate,
      trip_id: "",
      trip_date: tripDate,
      title: isFirst ? "Travel day" : isLast ? "Departure day" : "On the trip",
      activities: [],
      weather_summary: null,
      notes: null,
    };
  });
}

async function upsertCalendarDay(
  tripId: string,
  day: CalendarDay,
  updates: Partial<Pick<CalendarDay, "title" | "notes" | "activities">>
): Promise<CalendarDay> {
  const payload = {
    title: updates.title ?? day.title,
    notes: updates.notes !== undefined ? updates.notes : day.notes,
    activities: updates.activities ?? day.activities ?? [],
  };

  if (isPersistedDay(day)) {
    const { data, error } = await supabase
      .from("calendar_days")
      .update(payload)
      .eq("id", day.id)
      .eq("trip_id", tripId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data as CalendarDay;
  }

  const { data, error } = await supabase
    .from("calendar_days")
    .insert({
      trip_id: tripId,
      trip_date: day.trip_date,
      weather_summary: day.weather_summary,
      ...payload,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as CalendarDay;
}

export function DayPlanSection({
  tripId,
  userId,
  startDate,
  endDate,
  calendarDays,
  outfits,
  onChanged,
  onError,
}: DayPlanSectionProps) {
  const planningDays = useMemo(
    () => buildPlanningDays(calendarDays, startDate, endDate),
    [calendarDays, startDate, endDate]
  );
  const [modeByDate, setModeByDate] = useState<Record<string, DayMode>>({});
  const [draftTitle, setDraftTitle] = useState<Record<string, string>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [eventTitle, setEventTitle] = useState<Record<string, string>>({});
  const [eventItems, setEventItems] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const titles: Record<string, string> = {};
    const notes: Record<string, string> = {};
    for (const day of planningDays) {
      titles[day.trip_date] = day.title;
      notes[day.trip_date] = day.notes ?? "";
    }
    setDraftTitle(titles);
    setDraftNotes(notes);
  }, [planningDays]);

  const outfitsByDate = useMemo(() => {
    const map: Record<string, Outfit[]> = {};
    for (const outfit of outfits) {
      if (!map[outfit.trip_date]) map[outfit.trip_date] = [];
      map[outfit.trip_date].push(outfit);
    }
    return map;
  }, [outfits]);

  const setMode = (tripDate: string, mode: DayMode) => {
    setModeByDate((prev) => ({ ...prev, [tripDate]: mode }));
  };

  const saveDayField = async (
    day: CalendarDay,
    updates: Partial<Pick<CalendarDay, "title" | "notes">>
  ) => {
    setSaving(true);
    try {
      await upsertCalendarDay(tripId, day, updates);
      await onChanged();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not save day");
    } finally {
      setSaving(false);
    }
  };

  const addEvent = async (day: CalendarDay) => {
    const title = (eventTitle[day.trip_date] ?? "").trim() || "New event";
    const itemsText = (eventItems[day.trip_date] ?? "").trim();
    const items = itemsText
      ? itemsText
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean)
          .map((name) => ({ name }))
      : [];

    setSaving(true);
    try {
      // Ensure the calendar day exists before linking plans to it.
      await upsertCalendarDay(tripId, day, {
        title: (draftTitle[day.trip_date] ?? day.title).trim() || day.title,
        notes: (draftNotes[day.trip_date] ?? day.notes ?? "").trim() || null,
      });

      const { error } = await supabase.from("outfits").insert({
        trip_id: tripId,
        user_id: userId,
        trip_date: day.trip_date,
        time_of_day: "all_day",
        title,
        description: "",
        activity_name: null,
        items,
      });
      if (error) throw new Error(error.message);

      setEventTitle((prev) => ({ ...prev, [day.trip_date]: "" }));
      setEventItems((prev) => ({ ...prev, [day.trip_date]: "" }));
      await onChanged();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not add event");
    } finally {
      setSaving(false);
    }
  };

  const deleteEvent = async (outfitId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("outfits").delete().eq("id", outfitId);
      if (error) throw new Error(error.message);
      await onChanged();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not delete event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="day-plan-list">
      <p className="day-plan-hint">
        Tap a day to view it. Use <strong>Edit day</strong> to change notes, plans, and what to wear.
      </p>

      {planningDays.map((day, index) => {
        const mode = modeByDate[day.trip_date] ?? "collapsed";
        const dayOutfits = outfitsByDate[day.trip_date] ?? [];
        const isFirst = index === 0;
        const isLast = index === planningDays.length - 1;
        const label = isFirst ? "Arrival" : isLast ? "Departure" : null;
        const packItems = dayOutfits.flatMap((outfit) => normalizeItems(outfit.items));

        if (mode === "collapsed") {
          return (
            <button
              key={day.trip_date}
              type="button"
              className="day-plan-card collapsed"
              onClick={() => setMode(day.trip_date, "view")}
            >
              <div className="day-plan-card-top">
                <div>
                  <strong>{formatDay(day.trip_date, { weekday: "long" })}</strong>
                  <small>
                    {formatDay(day.trip_date, { month: "short", day: "numeric" })}
                    {label ? ` · ${label}` : ""}
                  </small>
                </div>
                <ChevronDown size={18} />
              </div>
              <p>{day.title}</p>
              <span>
                {[
                  dayOutfits.length > 0 &&
                    `${dayOutfits.length} plan${dayOutfits.length === 1 ? "" : "s"}`,
                  packItems.length > 0 && `${packItems.length} to wear`,
                  day.notes && "Notes",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Tap to open"}
              </span>
            </button>
          );
        }

        return (
          <section className="day-plan-card expanded" key={day.trip_date}>
            <div className="day-plan-card-top">
              <button
                type="button"
                className="day-plan-collapse"
                onClick={() => setMode(day.trip_date, "collapsed")}
              >
                <div>
                  <strong>{formatDay(day.trip_date, { weekday: "long" })}</strong>
                  <small>
                    {formatDay(day.trip_date, { month: "short", day: "numeric" })}
                    {label ? ` · ${label}` : ""}
                  </small>
                </div>
                <ChevronDown size={18} className="rotated" />
              </button>
              {mode === "view" ? (
                <button
                  type="button"
                  className="day-edit-button"
                  onClick={() => setMode(day.trip_date, "edit")}
                >
                  <Pencil size={14} />
                  Edit day
                </button>
              ) : (
                <button
                  type="button"
                  className="day-edit-button primary"
                  disabled={saving}
                  onClick={() => setMode(day.trip_date, "view")}
                >
                  <Check size={14} />
                  Done
                </button>
              )}
            </div>

            {mode === "view" ? (
              <div className="day-plan-body">
                <h2>{day.title}</h2>
                {day.weather_summary && <p className="day-weather">{day.weather_summary}</p>}

                {dayOutfits.length > 0 && (
                  <div className="day-section">
                    <h3>Today&apos;s plans</h3>
                    {dayOutfits.map((outfit) => (
                      <article key={outfit.id} className="day-event">
                        <strong>{outfit.title}</strong>
                        {outfit.description && <p>{outfit.description}</p>}
                        {normalizeItems(outfit.items).length > 0 && (
                          <div className="activity-pills">
                            {normalizeItems(outfit.items).map((item, itemIndex) => (
                              <span key={`${item.name}-${itemIndex}`}>{item.name}</span>
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}

                {packItems.length > 0 && (
                  <div className="day-section">
                    <h3>What to wear</h3>
                    <div className="activity-pills">
                      {packItems.map((item, itemIndex) => (
                        <span key={`${item.name}-wear-${itemIndex}`}>
                          <Shirt size={12} /> {item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {day.notes && (
                  <div className="day-section">
                    <h3>Notes</h3>
                    <p className="day-note">{day.notes}</p>
                  </div>
                )}

                {!dayOutfits.length && !day.notes && (
                  <p className="day-empty">
                    Nothing planned yet — tap <strong>Edit day</strong> to add notes or events.
                  </p>
                )}
              </div>
            ) : (
              <div className="day-plan-body edit">
                <label>
                  Day title
                  <input
                    value={draftTitle[day.trip_date] ?? ""}
                    onChange={(event) =>
                      setDraftTitle((prev) => ({
                        ...prev,
                        [day.trip_date]: event.target.value,
                      }))
                    }
                    onBlur={() => {
                      const next = (draftTitle[day.trip_date] ?? "").trim();
                      if (!next || next === day.title) return;
                      void saveDayField(day, { title: next });
                    }}
                    placeholder="Beach morning, travel day…"
                  />
                </label>

                <label>
                  Shared notes
                  <textarea
                    value={draftNotes[day.trip_date] ?? ""}
                    onChange={(event) =>
                      setDraftNotes((prev) => ({
                        ...prev,
                        [day.trip_date]: event.target.value,
                      }))
                    }
                    onBlur={() => {
                      const next = (draftNotes[day.trip_date] ?? "").trim();
                      const current = (day.notes ?? "").trim();
                      if (next === current) return;
                      void saveDayField(day, { notes: next || null });
                    }}
                    rows={3}
                    placeholder="Meet in lobby at 9, dinner reservations…"
                  />
                </label>

                <div className="day-section">
                  <h3>Your plans / what to wear</h3>
                  {dayOutfits.map((outfit) => (
                    <article key={outfit.id} className="day-event editable">
                      <div>
                        <strong>{outfit.title}</strong>
                        {normalizeItems(outfit.items).length > 0 && (
                          <p>
                            {normalizeItems(outfit.items)
                              .map((item) => item.name)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Delete ${outfit.title}`}
                        onClick={() => void deleteEvent(outfit.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  ))}

                  <div className="day-add-event">
                    <input
                      value={eventTitle[day.trip_date] ?? ""}
                      onChange={(event) =>
                        setEventTitle((prev) => ({
                          ...prev,
                          [day.trip_date]: event.target.value,
                        }))
                      }
                      placeholder="Event title (e.g. Dinner)"
                    />
                    <input
                      value={eventItems[day.trip_date] ?? ""}
                      onChange={(event) =>
                        setEventItems((prev) => ({
                          ...prev,
                          [day.trip_date]: event.target.value,
                        }))
                      }
                      placeholder="What to wear (comma-separated)"
                    />
                    <button
                      type="button"
                      className="day-add-button"
                      disabled={saving}
                      onClick={() => void addEvent(day)}
                    >
                      <Plus size={16} />
                      Add plan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
