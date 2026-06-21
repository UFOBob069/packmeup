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
      label: "All",
      packed: progress.packed,
      total: progress.total,
    },
    ...travelers.map((t) => {
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
    <div
      className="flex w-full rounded-xl border bg-muted/40 p-1"
      role="tablist"
      aria-label="Filter by traveler"
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
              "min-w-0 flex-1 rounded-lg px-2 py-2 text-center transition-all sm:px-3",
              active
                ? "bg-background font-semibold text-foreground shadow-travel-sm"
                : "text-muted-foreground hover:text-foreground"
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
  );
}
