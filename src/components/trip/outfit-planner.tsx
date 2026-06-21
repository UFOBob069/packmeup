import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Outfit } from "@/lib/types";

interface OutfitPlannerProps {
  outfits: Outfit[];
}

export function OutfitPlanner({ outfits }: OutfitPlannerProps) {
  if (outfits.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        No outfit recommendations yet. Use the AI chat to generate outfits.
      </p>
    );
  }

  const byDate = outfits.reduce(
    (acc, outfit) => {
      if (!acc[outfit.trip_date]) acc[outfit.trip_date] = [];
      acc[outfit.trip_date].push(outfit);
      return acc;
    },
    {} as Record<string, Outfit[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(byDate).map(([date, dayOutfits]) => (
        <div key={date}>
          <h3 className="mb-3 font-semibold">{format(parseISO(date), "EEEE, MMM d")}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {dayOutfits.map((outfit) => (
              <Card key={outfit.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{outfit.title}</CardTitle>
                    <Badge variant="outline" className="text-xs capitalize">
                      {outfit.time_of_day.replace("_", " ")}
                    </Badge>
                  </div>
                  {outfit.activity_name && (
                    <Badge variant="secondary" className="w-fit text-xs">
                      {outfit.activity_name}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">{outfit.description}</p>
                  <ul className="space-y-1">
                    {(outfit.items as string[]).map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
