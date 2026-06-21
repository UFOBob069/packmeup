import { cn } from "@/lib/utils";
import { getCountdownLabel, getCountdownUrgency } from "@/lib/design-system";

interface CountdownWidgetProps {
  days: number;
  destination?: string;
  className?: string;
  compact?: boolean;
}

export function CountdownWidget({
  days,
  destination,
  className,
  compact,
}: CountdownWidgetProps) {
  const urgency = getCountdownUrgency(days);
  const label = getCountdownLabel(days);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4",
        urgency === "urgent" && "border-weather-orange/30 bg-weather-orange/5",
        urgency === "soon" && "border-primary/20 bg-primary/5",
        urgency === "relaxed" && "border-border bg-card",
        className
      )}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
      <div className="relative">
        {!compact && destination && (
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Departure countdown
          </p>
        )}
        <p
          className={cn(
            "text-display font-semibold tracking-tight",
            compact ? "text-xl" : "text-3xl",
            urgency === "urgent" && "text-weather-orange"
          )}
        >
          {label}
        </p>
        {!compact && destination && (
          <p className="mt-1 text-sm text-muted-foreground">until {destination}</p>
        )}
      </div>
    </div>
  );
}
