import { cn } from "@/lib/utils";

const activityColors: Record<string, string> = {
  Golf: "bg-golf-green/15 text-golf-green border-golf-green/25",
  Beach: "bg-sky-blue/20 text-sky-blue border-sky-blue/30",
  Pool: "bg-ocean-teal/15 text-ocean-teal border-ocean-teal/25",
  Hiking: "bg-golf-green/10 text-emerald-700 border-emerald-200 dark:text-golf-green",
  Wedding: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300",
  "Nice Dinners": "bg-warm-sand text-amber-800 border-amber-200 dark:text-warm-sand",
  "Business Meetings": "bg-soft-gray text-foreground border-border",
  "Theme Parks": "bg-sun-yellow/25 text-amber-700 border-sun-yellow/40",
  Running: "bg-ocean-teal/10 text-ocean-teal border-ocean-teal/20",
  Gym: "bg-primary/10 text-primary border-primary/20",
  Skiing: "bg-sky-blue/15 text-sky-blue border-sky-blue/25",
  Sightseeing: "bg-weather-orange/10 text-weather-orange border-weather-orange/20",
};

interface ActivityTagProps {
  name: string;
  className?: string;
  size?: "sm" | "md";
}

export function ActivityTag({ name, className, size = "sm" }: ActivityTagProps) {
  const colorClass = activityColors[name] ?? "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        colorClass,
        className
      )}
    >
      {name}
    </span>
  );
}
