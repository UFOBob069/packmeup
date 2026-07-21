"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { CalendarDays, Plus, Sparkles, Trash2 } from "lucide-react";
import { addTripActivity, deleteTripActivity } from "@/actions/trip-activities";
import { saveCalendarDayActivities } from "@/actions/packing";
import { ActivityTag } from "@/components/design/activity-tag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Activity, CalendarDay } from "@/lib/types";

interface ActivityHubProps {
  tripId: string;
  startDate: string;
  endDate: string;
  activities: Activity[];
  days: CalendarDay[];
  readOnly?: boolean;
}

export function ActivityHub({
  tripId,
  startDate,
  endDate,
  activities,
  days,
  readOnly = false,
}: ActivityHubProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [, startTransition] = useTransition();
  const dayByDate = useMemo(() => new Map(days.map((day) => [day.trip_date, day])), [days]);
  const dates = useMemo(
    () =>
      eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) }).map((date) =>
        format(date, "yyyy-MM-dd")
      ),
    [startDate, endDate]
  );

  const addActivity = () => {
    if (!draft.trim()) return;
    startTransition(async () => {
      await addTripActivity(tripId, draft);
      setDraft("");
      router.refresh();
    });
  };

  const toggleDayActivity = (tripDate: string, activityName: string) => {
    const day = dayByDate.get(tripDate);
    const current = (day?.activities as string[] | undefined) ?? [];
    const selected = current.some(
      (name) => name.toLowerCase() === activityName.toLowerCase()
    );
    const next = selected
      ? current.filter((name) => name.toLowerCase() !== activityName.toLowerCase())
      : [...current, activityName];

    startTransition(async () => {
      await saveCalendarDayActivities(tripId, tripDate, next, day?.id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-muted/20 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-display text-lg font-semibold">Activity hub</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add the things you plan to do, then assign them to trip days. They flow into
              your daily plan and outfit planning, and help organize activity gear.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-travel-sm">
        <h3 className="text-display font-semibold">Trip activities</h3>
        {!readOnly && (
          <div className="mt-3 flex gap-2">
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addActivity();
                }
              }}
              placeholder="Golf, beach, dinner, hiking…"
            />
            <Button type="button" onClick={addActivity} disabled={!draft.trim()}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add
            </Button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <span key={activity.id} className="inline-flex items-center gap-1">
                <ActivityTag name={activity.activity_name} />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        await deleteTripActivity(tripId, activity.id);
                        router.refresh();
                      })
                    }
                    className="rounded-full p-1 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${activity.activity_name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No activities added yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-travel-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <h3 className="text-display font-semibold">Assign activities by day</h3>
        </div>
        <div className="mt-4 divide-y rounded-xl border">
          {dates.map((tripDate) => {
            const day = dayByDate.get(tripDate);
            const selected = (day?.activities as string[] | undefined) ?? [];
            return (
              <div
                key={tripDate}
                className="grid gap-3 px-4 py-3 sm:grid-cols-[120px_minmax(0,1fr)]"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {format(parseISO(tripDate), "EEEE")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(tripDate), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activities.length > 0 ? (
                    activities.map((activity) => {
                      const isSelected = selected.some(
                        (name) =>
                          name.toLowerCase() === activity.activity_name.toLowerCase()
                      );
                      return (
                        <button
                          key={activity.id}
                          type="button"
                          disabled={readOnly}
                          onClick={() =>
                            toggleDayActivity(tripDate, activity.activity_name)
                          }
                          className={
                            isSelected
                              ? "rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                              : "rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                          }
                        >
                          {activity.activity_name}
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Add trip activities above first.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
