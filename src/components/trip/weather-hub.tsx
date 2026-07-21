import { CalendarDays, CloudSun, RefreshCw } from "lucide-react";
import { WeatherCalendar } from "@/components/design/weather-card";
import type { WeatherData } from "@/lib/types";

interface WeatherHubProps {
  destination: string;
  weather: WeatherData | null;
}

export function WeatherHub({ destination, weather }: WeatherHubProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-muted/20 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-blue/15 text-sky-blue">
            <CloudSun className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-display text-lg font-semibold">Weather</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The forecast updates automatically and flows into each day, packing
              suggestions, and outfit planning.
            </p>
          </div>
        </div>
      </div>

      {weather?.daily?.length ? (
        <>
          <WeatherCalendar location={weather.location || destination} days={weather.daily} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
              <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">Feeds your master itinerary</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Each forecast is matched to its full date in By Day.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
              <RefreshCw className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">Automatically refreshed</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Last checked{" "}
                  {new Date(weather.fetched_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                  .
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <CloudSun className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">Forecast not available yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Forecasts appear as your trip dates come into range.
          </p>
        </div>
      )}
    </div>
  );
}
