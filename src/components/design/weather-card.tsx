import { CloudRain, Sun, Wind, Cloud } from "lucide-react";
import { format, getDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { WeatherDay } from "@/lib/types";

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

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface MonthGroup {
  monthLabel: string;
  /** Cells for the grid: null = leading/trailing padding */
  cells: (WeatherDay | null)[];
}

function groupDaysIntoMonths(days: WeatherDay[]): MonthGroup[] {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const groups: MonthGroup[] = [];
  let current: { key: string; label: string; days: WeatherDay[] } | null = null;

  for (const day of sorted) {
    const date = parseISO(day.date);
    const key = format(date, "yyyy-MM");
    if (!current || current.key !== key) {
      if (current) {
        groups.push(buildMonthGroup(current.label, current.days));
      }
      current = { key, label: format(date, "MMMM yyyy"), days: [day] };
    } else {
      current.days.push(day);
    }
  }
  if (current) {
    groups.push(buildMonthGroup(current.label, current.days));
  }
  return groups;
}

function buildMonthGroup(monthLabel: string, days: WeatherDay[]): MonthGroup {
  const leadingBlanks = getDay(parseISO(days[0].date));
  const cells: (WeatherDay | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return { monthLabel, cells };
}

function WeatherCalendarCell({
  day,
  onSelectDate,
}: {
  day: WeatherDay | null;
  onSelectDate?: (date: string) => void;
}) {
  if (!day) {
    return <div className="rounded-lg" aria-hidden />;
  }

  const rainy = day.rain_chance > 30;
  const content = (
    <>
      <span className="text-[11px] font-semibold sm:text-xs">
        {format(parseISO(day.date), "d")}
      </span>
      <WeatherIcon
        conditions={day.conditions}
        className="my-1 h-4 w-4 text-weather-orange sm:h-5 sm:w-5"
      />
      <span className="text-[11px] font-semibold leading-tight sm:text-xs">
        {day.temp_high}°F
      </span>
      <span className="text-[10px] leading-tight text-muted-foreground">
        {day.temp_low}°
      </span>
      {day.source === "seasonal" && (
        <span className="mt-0.5 text-[9px] font-medium leading-tight text-muted-foreground">
          typical
        </span>
      )}
      {rainy && day.source !== "seasonal" && (
        <span className="mt-0.5 text-[9px] font-medium leading-tight text-sky-blue">
          {day.rain_chance}%
        </span>
      )}
    </>
  );

  const className = cn(
    "flex min-h-20 flex-col items-center rounded-lg border bg-background p-1.5 text-center sm:p-2",
    rainy && day.source !== "seasonal" && "bg-sky-blue/5",
    day.source === "seasonal" && "border-dashed bg-muted/30",
    onSelectDate &&
      "cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-travel-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  );

  if (onSelectDate) {
    return (
      <button
        type="button"
        onClick={() => onSelectDate(day.date)}
        className={className}
        aria-label={`Open ${format(parseISO(day.date), "EEEE, MMMM d")} in By Day`}
        title="Open in By Day"
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

interface WeatherCalendarProps {
  location: string;
  days: WeatherDay[];
  className?: string;
  onSelectDate?: (date: string) => void;
}

export function WeatherCalendar({
  location,
  days,
  className,
  onSelectDate,
}: WeatherCalendarProps) {
  if (!days.length) return null;

  const months = groupDaysIntoMonths(days);
  const hasSeasonal = days.some((d) => d.source === "seasonal");
  const hasForecast = days.some((d) => d.source === "forecast" || !d.source);

  return (
    <div className={cn("rounded-2xl border bg-card p-5 shadow-travel-sm", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {hasSeasonal && !hasForecast
              ? "Typical weather"
              : hasSeasonal
                ? "Forecast + typical"
                : "Trip forecast"}
          </p>
          <p className="text-display text-lg font-semibold">{location}</p>
          <p className="text-xs text-muted-foreground">
            {days.length} day{days.length !== 1 ? "s" : ""}
            {hasSeasonal
              ? " · Farther dates show typical temps for this time of year"
              : ""}
          </p>
        </div>
        <Sun className="h-5 w-5 text-sun-yellow" />
      </div>

      <div className="space-y-5">
        {months.map((month) => (
          <div key={month.monthLabel}>
            <p className="text-display mb-2 text-sm font-semibold">{month.monthLabel}</p>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {WEEKDAY_LABELS.map((label) => (
                <span
                  key={label}
                  className="pb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]"
                >
                  {label}
                </span>
              ))}
              {month.cells.map((day, index) => (
                <WeatherCalendarCell
                  key={day?.date ?? `blank-${index}`}
                  day={day}
                  onSelectDate={onSelectDate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

