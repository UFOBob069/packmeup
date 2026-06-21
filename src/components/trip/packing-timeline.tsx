import { cn } from "@/lib/utils";
import type { TimelineMilestone } from "@/lib/design-system";
import { Check, Circle } from "lucide-react";

interface PackingTimelineProps {
  milestones: TimelineMilestone[];
  className?: string;
}

export function PackingTimeline({ milestones, className }: PackingTimelineProps) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-travel-sm", className)}>
      <p className="mb-5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Departure preparation
      </p>
      <div className="relative space-y-0">
        {milestones.map((milestone, i) => (
          <div key={milestone.label} className="relative flex gap-4 pb-6 last:pb-0">
            {i < milestones.length - 1 && (
              <div
                className={cn(
                  "absolute left-[11px] top-7 h-[calc(100%-12px)] w-0.5",
                  milestone.completed ? "bg-golf-green/40" : "bg-border"
                )}
              />
            )}
            <div
              className={cn(
                "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                milestone.completed
                  ? "border-golf-green bg-golf-green text-white"
                  : milestone.active
                    ? "border-primary bg-primary/10"
                    : "border-muted-foreground/25 bg-background"
              )}
            >
              {milestone.completed ? (
                <Check className="h-3 w-3" />
              ) : (
                <Circle className={cn("h-2 w-2", milestone.active && "fill-primary text-primary")} />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={cn(
                  "text-display font-semibold",
                  milestone.active && "text-primary",
                  milestone.completed && "text-muted-foreground"
                )}
              >
                {milestone.label}
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {milestone.tasks.map((task) => (
                  <li key={task} className="text-sm text-muted-foreground">
                    · {task}
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
