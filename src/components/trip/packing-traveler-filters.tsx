"use client";

import type { PackingProgress, Traveler } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TravelerPackingFiltersProps {
  travelers: Traveler[];
  progress: PackingProgress;
  value: string;
  onChange: (value: string) => void;
}

export function TravelerPackingFilters({
  travelers,
  progress,
  value,
  onChange,
}: TravelerPackingFiltersProps) {
  const sharedStats = progress.byTraveler.shared;

  const filters: { id: string; label: string; packed: number; total: number }[] = [
    {
      id: "all",
      label: "My list",
      packed: progress.packed,
      total: progress.total,
    },
    ...travelers
      .filter((t) => (progress.byTraveler[t.id]?.total ?? 0) > 0)
      .map((t) => {
        const stats = progress.byTraveler[t.id];
        return {
          id: t.id,
          label: t.traveler_type === "pet" ? `🐾 ${t.name}` : t.name,
          packed: stats?.packed ?? 0,
          total: stats?.total ?? 0,
        };
      }),
  ];

  if (sharedStats && sharedStats.total > 0) {
    filters.push({
      id: "shared",
      label: "Shared",
      packed: sharedStats.packed,
      total: sharedStats.total,
    });
  }

  return (
    <div className="space-y-2">
      <div
        className="flex w-full rounded-xl border bg-muted/40 p-1"
        role="tablist"
        aria-label="Filter your packing list"
      >
        {filters.map((filter) => {
          const active = value === filter.id;

          return (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(filter.id)}
              className={cn(
                "min-w-0 flex-1 cursor-pointer rounded-lg px-2 py-2 text-center transition-all sm:px-3",
                active
                  ? "bg-background font-semibold text-foreground shadow-travel-sm"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground hover:shadow-sm"
              )}
            >
              <span className="block truncate text-sm">{filter.label}</span>
              <span
                className={cn(
                  "mt-0.5 block text-[10px] tabular-nums sm:text-xs",
                  active ? "text-muted-foreground" : "text-muted-foreground/70"
                )}
              >
                {filter.packed}/{filter.total}
              </span>
            </button>
          );
        })}
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        Your clothes stay private. Shared items (sunscreen, first aid, etc.) are visible to everyone
        on the trip.
      </p>
    </div>
  );
}
