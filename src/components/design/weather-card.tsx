import { CloudRain, Sun, Wind, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeatherDay } from "@/lib/types";

interface WeatherCardProps {
  day: WeatherDay;
  className?: string;
  compact?: boolean;
}

function WeatherIcon({ conditions, className }: { conditions: string; className?: string }) {
  const lower = conditions.toLowerCase();
  if (lower.includes("rain") || lower.includes("drizzle") || lower.includes("shower")) {
    return <CloudRain className={className} />;
  }
  if (lower.includes("clear") || lower.includes("sun")) {
    return <Sun className={className} />;
  }
  if (lower.includes("wind") || lower.includes("breeze")) {
    return <Wind className={className} />;
  }
  return <Cloud className={className} />;
}

export function WeatherCard({ day, className, compact }: WeatherCardProps) {
  const date = new Date(day.date + "T12:00:00");
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border bg-card p-3 text-center transition-shadow hover:shadow-travel-sm",
        compact ? "min-w-18" : "min-w-22",
        className
      )}
    >
      <span className="text-xs font-semibold">{dayName}</span>
      <span className="text-[10px] text-muted-foreground">{dateLabel}</span>
      <WeatherIcon
        conditions={day.conditions}
        className={cn("my-1.5 text-weather-orange", compact ? "h-5 w-5" : "h-6 w-6")}
      />
      <span className="text-sm font-semibold">{day.temp_high}°</span>
      <span className="text-xs text-muted-foreground">{day.temp_low}° low</span>
      {day.rain_chance > 30 && (
        <span className="mt-1 text-[10px] font-medium text-sky-blue dark:text-sky-blue">
          {day.rain_chance}% rain
        </span>
      )}
    </div>
  );
}

interface WeatherPreviewProps {
  location: string;
  days: WeatherDay[];
  className?: string;
  /** Max days to show; omit to show the full trip forecast */
  maxDays?: number;
}

export function WeatherPreview({ location, days, className, maxDays }: WeatherPreviewProps) {
  if (!days.length) return null;

  const visibleDays = maxDays ? days.slice(0, maxDays) : days;

  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-travel-sm", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Trip forecast
          </p>
          <p className="text-display text-lg font-semibold">{location}</p>
          <p className="text-xs text-muted-foreground">
            {visibleDays.length} day{visibleDays.length !== 1 ? "s" : ""}
            {maxDays && days.length > maxDays ? ` · ${days.length} total available` : ""}
          </p>
        </div>
        <Sun className="h-5 w-5 text-sun-yellow" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {visibleDays.map((day) => (
          <WeatherCard key={day.date} day={day} compact />
        ))}
      </div>
    </div>
  );
}
