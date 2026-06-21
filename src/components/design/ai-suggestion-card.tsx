import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CloudRain,
  Luggage,
  PawPrint,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import type { AiRecommendation } from "@/lib/design-system";

const iconMap: Record<AiRecommendation["icon"], LucideIcon> = {
  alert: AlertCircle,
  cloud: CloudRain,
  luggage: Luggage,
  paw: PawPrint,
  sparkles: Sparkles,
};

const typeStyles: Record<AiRecommendation["type"], string> = {
  missing: "border-weather-orange/20 bg-weather-orange/5",
  weather: "border-sky-blue/30 bg-sky-blue/10 dark:bg-sky-blue/5",
  carryon: "border-primary/20 bg-primary/5",
  duplicate: "border-golf-green/20 bg-golf-green/5",
  pet: "border-warm-sand bg-warm-sand/50 dark:bg-warm-sand/10",
};

interface AiSuggestionCardProps {
  recommendation: AiRecommendation;
  className?: string;
}

export function AiSuggestionCard({ recommendation, className }: AiSuggestionCardProps) {
  const Icon = iconMap[recommendation.icon];

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4 transition-all hover:shadow-travel-sm",
        typeStyles[recommendation.type],
        className
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/80">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{recommendation.message}</p>
    </div>
  );
}

interface AiSuggestionListProps {
  recommendations: AiRecommendation[];
  className?: string;
}

export function AiSuggestionList({ recommendations, className }: AiSuggestionListProps) {
  if (!recommendations.length) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        AI recommendations
      </p>
      <div className="space-y-2">
        {recommendations.map((rec) => (
          <AiSuggestionCard key={rec.id} recommendation={rec} />
        ))}
      </div>
    </div>
  );
}
