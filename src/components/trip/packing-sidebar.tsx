"use client";

import {
  AlertTriangle,
  CloudRain,
  Lightbulb,
  Luggage,
  PawPrint,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/design/progress-ring";
import { PackingTimeline } from "./packing-timeline";
import type { GearItem, PackingProgress, TripWithDetails, WeatherData } from "@/lib/types";
import {
  generatePackingCoachAlerts,
  generateSmartInsights,
  getReadinessStatus,
  getRecommendedNextSteps,
  type AiRecommendation,
  type TimelineMilestone,
} from "@/lib/design-system";
import { TripReadinessPanel } from "@/components/trip/trip-readiness-panel";
import { cn } from "@/lib/utils";

interface PackingSidebarProps {
  trip: TripWithDetails;
  progress: PackingProgress;
  daysUntil: number;
  timeline: TimelineMilestone[];
  gearItems: GearItem[];
  onOptimize: () => void;
  className?: string;
}

function AlertIcon({ rec }: { rec: AiRecommendation }) {
  const className = "h-4 w-4 shrink-0";
  switch (rec.icon) {
    case "paw":
      return <PawPrint className={cn(className, "text-amber-600")} />;
    case "cloud":
      return <CloudRain className={cn(className, "text-sky-blue")} />;
    case "luggage":
      return <Luggage className={cn(className, "text-primary")} />;
    case "sparkles":
      return <Lightbulb className={cn(className, "text-golf-green")} />;
    default:
      return <AlertTriangle className={cn(className, "text-weather-orange")} />;
  }
}

export function PackingSidebar({
  trip,
  progress,
  daysUntil,
  timeline,
  gearItems,
  onOptimize,
  className,
}: PackingSidebarProps) {
  const weather = trip.weather_data as WeatherData | null;
  const readiness = getReadinessStatus(progress.percentage, daysUntil);
  const nextSteps = getRecommendedNextSteps(
    trip.packing_items,
    trip.travelers,
    trip.activities.map((a) => a.activity_name)
  );
  const coachAlerts = generatePackingCoachAlerts(
    trip.packing_items,
    trip.travelers,
    weather,
    trip.travel_type
  );
  const insights = generateSmartInsights(
    trip.packing_items,
    trip.travelers,
    weather,
    trip.travel_type
  );

  const travelerRows = [
    ...trip.travelers.map((t) => {
      const stats = progress.byTraveler[t.id] ?? { name: t.name, packed: 0, total: 0 };
      return {
        id: t.id,
        ...stats,
        name: t.traveler_type === "pet" ? `🐾 ${t.name}` : t.name,
      };
    }),
    ...(progress.byTraveler.shared?.total
      ? [{ id: "shared", ...progress.byTraveler.shared }]
      : []),
  ];

  return (
    <aside className={cn("space-y-4", className)}>
      <section className="rounded-2xl border bg-card p-5 shadow-travel-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Packing readiness
        </p>
        <div className="mt-4 flex items-center gap-4">
          <ProgressRing value={progress.percentage} size={72} strokeWidth={6} sublabel="ready" />
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                readiness.badgeClass
              )}
            >
              {readiness.label}
            </span>
            <p className={cn("mt-2 text-sm font-medium", readiness.accentClass)}>
              {readiness.message}
            </p>
            {daysUntil >= 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {daysUntil === 0
                  ? "Departure is today"
                  : `${daysUntil} day${daysUntil === 1 ? "" : "s"} until you leave`}
              </p>
            )}
          </div>
        </div>
        {nextSteps.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">Recommended next steps</p>
            <ul className="mt-2 space-y-1.5">
              {nextSteps.map((step) => (
                <li key={step} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <TripReadinessPanel trip={trip} gearItems={gearItems} />

      <section className="rounded-2xl border bg-gradient-to-br from-primary/5 to-sky-blue/5 p-5 shadow-travel-sm">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-display text-sm font-semibold">AI packing coach</p>
        </div>
        <div className="space-y-2">
          {[...coachAlerts, ...insights].slice(0, 5).map((rec) => (
            <div
              key={rec.id}
              className={cn(
                "flex gap-2.5 rounded-xl border bg-background/80 px-3 py-2.5 text-sm leading-snug",
                rec.severity === "warning"
                  ? "border-weather-orange/20"
                  : "border-primary/10"
              )}
            >
              <AlertIcon rec={rec} />
              <span>{rec.message}</span>
            </div>
          ))}
          {coachAlerts.length === 0 && insights.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Looking good — keep checking items off your list.
            </p>
          )}
        </div>
        <Button onClick={onOptimize} className="mt-4 w-full" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          Optimize my list
        </Button>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-travel-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Traveler progress
        </p>
        <div className="space-y-3">
          {travelerRows.map((row) => {
            const pct = row.total > 0 ? Math.round((row.packed / row.total) * 100) : 0;
            return (
              <div key={row.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{row.name}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.packed} / {row.total}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <PackingTimeline milestones={timeline} compact />
    </aside>
  );
}
