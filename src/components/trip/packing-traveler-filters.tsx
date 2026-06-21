"use client";

import type { PackingProgress, Traveler } from "@/lib/types";
import { ProgressRing } from "@/components/design/progress-ring";
import { cn } from "@/lib/utils";

interface PackingProgressHeaderProps {
  progress: PackingProgress;
  daysUntil: number;
}

export function PackingProgressHeader({ progress, daysUntil }: PackingProgressHeaderProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-card px-4 py-3 shadow-travel-sm sm:px-5">
      <ProgressRing value={progress.percentage} size={52} strokeWidth={5} sublabel="packed" />
      <div className="min-w-0 flex-1">
        <p className="text-display text-lg font-semibold">
          {progress.packed} of {progress.total} packed
        </p>
        <p className="text-sm text-muted-foreground">
          {progress.percentage >= 100
            ? "All set — you're ready to go!"
            : daysUntil >= 0
              ? `${daysUntil} day${daysUntil === 1 ? "" : "s"} until departure`
              : "Trip in progress"}
        </p>
      </div>
    </div>
  );
}

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
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by traveler">
      {filters.map((filter) => {
        const active = value === filter.id;
        const pct = filter.total > 0 ? Math.round((filter.packed / filter.total) * 100) : 0;

        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(filter.id)}
            className={cn(
              "rounded-xl border px-4 py-2.5 text-left transition-all",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-travel-sm"
                : "bg-card hover:border-primary/30 hover:bg-muted/50"
            )}
          >
            <span className="block text-sm font-semibold">{filter.label}</span>
            <span
              className={cn(
                "mt-0.5 block text-xs tabular-nums",
                active ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {filter.packed}/{filter.total} · {pct}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
