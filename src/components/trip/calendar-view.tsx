import { format, parseISO } from "date-fns";
import { Cloud, Sun } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CalendarDay, Outfit } from "@/lib/types";

interface CalendarViewProps {
  days: CalendarDay[];
  outfits: Outfit[];
}

export function CalendarView({ days, outfits }: CalendarViewProps) {
  if (days.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">No calendar data available.</p>
    );
  }

  const outfitsByDate = outfits.reduce(
    (acc, o) => {
      if (!acc[o.trip_date]) acc[o.trip_date] = [];
      acc[o.trip_date].push(o);
      return acc;
    },
    {} as Record<string, Outfit[]>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {days.map((day) => (
        <Card key={day.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {format(parseISO(day.trip_date), "EEEE")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(day.trip_date), "MMMM d")}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-medium">{day.title}</p>
            {day.weather_summary && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sun className="h-4 w-4" />
                {day.weather_summary}
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {(day.activities as string[]).map((activity, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {activity}
                </Badge>
              ))}
            </div>
            {outfitsByDate[day.trip_date]?.map((outfit) => (
              <div key={outfit.id} className="rounded-lg border p-2 text-sm">
                <p className="font-medium">{outfit.title}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {outfit.time_of_day.replace("_", " ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
