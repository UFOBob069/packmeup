import { cn } from "@/lib/utils";
import type { TimelineMilestone } from "@/lib/design-system";
import { Check, Circle } from "lucide-react";

interface PackingTimelineProps {
  milestones: TimelineMilestone[];
  className?: string;
  compact?: boolean;
}

export function PackingTimeline({ milestones, className, compact }: PackingTimelineProps) {
  return (
    <section className={cn("rounded-2xl border bg-card shadow-travel-sm", compact ? "p-4" : "p-5", className)}>
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Departure timeline
      </p>
      <div className="relative space-y-0">
        {milestones.map((milestone, i) => (
          <div
            key={milestone.label}
            className={cn("relative flex gap-3", compact ? "pb-4 last:pb-0" : "pb-6 last:pb-0")}
          >
            {i < milestones.length - 1 && (
              <div
                className={cn(
                  "absolute left-[9px] top-6 h-[calc(100%-8px)] w-0.5",
                  milestone.completed ? "bg-golf-green/40" : "bg-border"
                )}
              />
            )}
            <div
              className={cn(
                "relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                milestone.completed
                  ? "border-golf-green bg-golf-green text-white"
                  : milestone.active
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/25 bg-background"
              )}
            >
              {milestone.completed ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                <Circle
                  className={cn("h-1.5 w-1.5", milestone.active && "fill-primary text-primary")}
                />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0">
              <p
                className={cn(
                  "text-sm font-semibold",
                  milestone.active && "text-primary",
                  milestone.completed && "text-muted-foreground"
                )}
              >
                {milestone.label}
              </p>
              <ul className="mt-1 space-y-0.5">
                {milestone.tasks.map((task) => (
                  <li key={task} className="text-xs text-muted-foreground">
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
