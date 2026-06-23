"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { resolvePackingGap } from "@/actions/packing";
import { Button } from "@/components/ui/button";
import {
  analyzePackingGaps,
  type PackingGap,
} from "@/lib/packing/gap-analysis";
import type { GearItem, TripWithDetails } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TripReadinessPanelProps {
  trip: TripWithDetails;
  gearItems: GearItem[];
  className?: string;
}

export function TripReadinessPanel({ trip, gearItems, className }: TripReadinessPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const gaps = useMemo(
    () => analyzePackingGaps(trip, gearItems),
    [trip, gearItems]
  );

  const warnings = gaps.filter((g) => g.severity === "warning");
  const infos = gaps.filter((g) => g.severity === "info");
  const topGaps = [...warnings, ...infos].slice(0, 6);

  const handleFix = (gap: PackingGap) => {
    if (!gap.fix) return;
    startTransition(async () => {
      await resolvePackingGap(trip.id, gap.fix!);
      router.refresh();
    });
  };

  if (gaps.length === 0) {
    return (
      <section className={cn("rounded-2xl border bg-card p-5 shadow-travel-sm", className)}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-golf-green" />
          <p className="text-display text-sm font-semibold">Trip readiness</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          No gaps found — your day plan and checklist look aligned.
        </p>
      </section>
    );
  }

  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-travel-sm", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-weather-orange" />
          <p className="text-display text-sm font-semibold">Am I missing anything?</p>
        </div>
        {warnings.length > 0 && (
          <span className="rounded-full bg-weather-orange/15 px-2 py-0.5 text-[10px] font-semibold text-weather-orange">
            {warnings.length} to fix
          </span>
        )}
      </div>
      <ul className="mt-3 space-y-2">
        {topGaps.map((gap) => (
          <li
            key={gap.id}
            className={cn(
              "flex items-start justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm leading-snug",
              gap.severity === "warning"
                ? "border-weather-orange/25 bg-weather-orange/5"
                : "border-border bg-muted/20"
            )}
          >
            <span>{gap.message}</span>
            {gap.fix && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleFix(gap)}
                className="h-7 shrink-0 cursor-pointer rounded-full px-2.5 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            )}
          </li>
        ))}
      </ul>
      {gaps.length > topGaps.length && (
        <p className="mt-2 text-xs text-muted-foreground">
          +{gaps.length - topGaps.length} more — ask Packing Help for details.
        </p>
      )}
    </section>
  );
}
