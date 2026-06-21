import { LucideIcon, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-3xl border border-dashed bg-gradient-to-b from-muted/30 to-transparent px-6 py-16 text-center",
        className
      )}
    >
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        {emoji ? (
          <span className="text-3xl">{emoji}</span>
        ) : Icon ? (
          <Icon className="h-8 w-8 text-primary" />
        ) : (
          <Sparkles className="h-8 w-8 text-primary" />
        )}
      </div>
      <h3 className="text-display text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Button asChild className="mt-6 rounded-full px-6" size="lg">
          <a href={actionHref}>{actionLabel}</a>
        </Button>
      )}
      {actionLabel && onAction && (
        <Button className="mt-6 rounded-full px-6" size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function EmptyTrips() {
  return (
    <EmptyState
      emoji="✈️"
      title="No trips yet?"
      description="Let's plan your next adventure. Tell us where you're going and we'll build your perfect packing list."
      actionLabel="Plan your first trip"
      actionHref="/trips/new"
    />
  );
}

export function EmptyOutfits() {
  return (
    <EmptyState
      emoji="👔"
      title="No outfit plan yet"
      description="We'll build daily outfits from your activities and weather — so you always know what to wear."
    />
  );
}
