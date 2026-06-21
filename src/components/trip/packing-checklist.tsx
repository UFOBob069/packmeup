"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackingItem, Traveler } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/constants";
import { toggleItemPacked, updateItemNotes } from "@/actions/packing";
import { TravelerAvatar } from "@/components/design/traveler-avatar";

interface PackingChecklistProps {
  items: PackingItem[];
  travelers: Traveler[];
  tripId: string;
  filterTraveler?: string | null;
  filterActivity?: string | null;
  readOnly?: boolean;
}

export function PackingChecklist({
  items,
  travelers,
  tripId,
  filterTraveler,
  filterActivity,
  readOnly,
}: PackingChecklistProps) {
  const [isPending, startTransition] = useTransition();

  let filtered = items;
  if (filterTraveler === "shared") {
    filtered = items.filter((i) => i.shared);
  } else if (filterTraveler) {
    filtered = items.filter((i) => i.traveler_id === filterTraveler);
  }
  if (filterActivity) {
    filtered = filtered.filter(
      (i) => i.activity_name?.toLowerCase() === filterActivity.toLowerCase()
    );
  }

  const grouped = filtered.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, PackingItem[]>
  );

  const travelerMap = Object.fromEntries(travelers.map((t) => [t.id, t]));
  const travelerIndex = Object.fromEntries(travelers.map((t, i) => [t.id, i]));

  const handleToggle = (itemId: string, packed: boolean) => {
    startTransition(async () => {
      await toggleItemPacked(tripId, itemId, packed);
    });
  };

  if (filtered.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nothing here yet — your list will appear as you pack.
      </p>
    );
  }

  return (
    <div className={cn("space-y-8", isPending && "opacity-80")}>
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <section key={category}>
          <h3 className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-base">
              {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ?? "📦"}
            </span>
            <span className="text-display font-semibold">
              {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category}
            </span>
            <span className="text-xs text-muted-foreground">
              {categoryItems.filter((i) => i.packed).length}/{categoryItems.length}
            </span>
          </h3>
          <div className="space-y-2">
            {categoryItems.map((item) => {
              const traveler = item.traveler_id ? travelerMap[item.traveler_id] : null;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl border bg-card p-4 transition-all duration-200",
                    "hover:shadow-travel-sm",
                    item.packed && "border-primary/10 bg-primary/[0.02]"
                  )}
                >
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => handleToggle(item.id, !item.packed)}
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                      item.packed
                        ? "border-primary bg-primary text-primary-foreground animate-check"
                        : "border-muted-foreground/25 hover:border-primary/50"
                    )}
                    aria-label={item.packed ? "Mark unpacked" : "Mark packed"}
                  >
                    {item.packed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "font-medium transition-colors",
                          item.packed && "text-muted-foreground line-through"
                        )}
                      >
                        {item.quantity > 1 && (
                          <span className="text-muted-foreground">{item.quantity}× </span>
                        )}
                        {item.item_name}
                      </span>
                      {item.shared && (
                        <span className="rounded-full bg-ocean-teal/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ocean-teal">
                          Shared
                        </span>
                      )}
                    </div>
                    {!readOnly && (
                      <input
                        placeholder="Add a note..."
                        defaultValue={item.notes ?? ""}
                        onBlur={(e) => {
                          if (e.target.value !== (item.notes ?? "")) {
                            startTransition(async () => {
                              await updateItemNotes(tripId, item.id, e.target.value);
                            });
                          }
                        }}
                        className="mt-1 w-full border-0 bg-transparent p-0 text-xs text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
                      />
                    )}
                  </div>

                  {traveler && (
                    <TravelerAvatar
                      name={traveler.name}
                      type={traveler.traveler_type}
                      index={travelerIndex[traveler.id] ?? 0}
                      size="sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
