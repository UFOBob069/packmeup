import { PawPrint } from "lucide-react";
import type { PackingItem, Traveler } from "@/lib/types";
import { ProgressRing } from "@/components/design/progress-ring";
import { cn } from "@/lib/utils";

interface PetTravelCardProps {
  pet: Traveler;
  items: PackingItem[];
  className?: string;
}

export function PetTravelCard({ pet, items, className }: PetTravelCardProps) {
  const petItems = items.filter((i) => i.traveler_id === pet.id);
  const packed = petItems.filter((i) => i.packed).length;
  const progress = petItems.length ? Math.round((packed / petItems.length) * 100) : 0;

  if (petItems.length === 0) return null;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-warm-sand bg-gradient-to-br from-warm-sand/60 to-warm-sand/20 dark:from-warm-sand/10 dark:to-transparent",
        className
      )}
    >
      <div className="flex items-center gap-4 border-b border-amber-200/50 p-5 dark:border-amber-800/20">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-2xl shadow-travel-sm">
          🐾
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-700/70 dark:text-warm-sand/70">
            Pet travel
          </p>
          <h3 className="text-display text-xl font-semibold">{pet.name}</h3>
          <p className="text-sm text-muted-foreground">
            {packed} of {petItems.length} essentials packed
          </p>
        </div>
        <ProgressRing value={progress} size={56} strokeWidth={5} />
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {petItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-xl bg-background/80 p-3 backdrop-blur-sm",
              item.packed && "opacity-75"
            )}
          >
            <PawPrint className="h-4 w-4 shrink-0 text-amber-600 dark:text-warm-sand" />
            <span className={cn("text-sm font-medium", item.packed && "line-through text-muted-foreground")}>
              {item.item_name}
            </span>
            <div
              className={cn(
                "ml-auto h-2 w-2 rounded-full",
                item.packed ? "bg-golf-green" : "bg-muted-foreground/30"
              )}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
