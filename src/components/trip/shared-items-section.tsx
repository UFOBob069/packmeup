import { Share2, Sparkles } from "lucide-react";
import type { PackingItem } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SharedItemsSectionProps {
  items: PackingItem[];
  className?: string;
}

export function SharedItemsSection({ items, className }: SharedItemsSectionProps) {
  const shared = items.filter((i) => i.shared);
  const packed = shared.filter((i) => i.packed).length;

  if (shared.length === 0) return null;

  return (
    <section className={cn("rounded-2xl border border-ocean-teal/20 bg-ocean-teal/5 p-5", className)}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ocean-teal/15">
            <Share2 className="h-5 w-5 text-ocean-teal" />
          </div>
          <div>
            <h3 className="text-display font-semibold">Shared items</h3>
            <p className="text-sm text-muted-foreground">
              {packed}/{shared.length} packed · one for the whole group
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-golf-green/10 px-3 py-1 text-xs font-medium text-golf-green">
          <Sparkles className="h-3 w-3" />
          Saved {shared.length} duplicates
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {shared.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-card p-3 transition-all",
              item.packed && "opacity-70"
            )}
          >
            <span className="text-lg">
              {CATEGORY_ICONS[item.category as keyof typeof CATEGORY_ICONS] ?? "📦"}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm font-medium", item.packed && "line-through")}>
                {item.item_name}
              </p>
              {item.quantity > 1 && (
                <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
              )}
            </div>
            <div
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                item.packed ? "bg-golf-green" : "bg-muted-foreground/30"
              )}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
