"use client";

import { useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { PackingItem, Traveler } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/constants";
import { toggleItemPacked, updateItemNotes } from "@/actions/packing";
import { cn } from "@/lib/utils";

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

  const travelerMap = Object.fromEntries(travelers.map((t) => [t.id, t.name]));

  const handleToggle = (itemId: string, packed: boolean) => {
    startTransition(async () => {
      await toggleItemPacked(tripId, itemId, packed);
    });
  };

  const handleNotes = (itemId: string, notes: string) => {
    startTransition(async () => {
      await updateItemNotes(tripId, itemId, notes);
    });
  };

  if (filtered.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">No items in this view.</p>
    );
  }

  return (
    <div className={cn("space-y-6", isPending && "opacity-70")}>
      {Object.entries(grouped).map(([category, categoryItems]) => (
        <div key={category}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <span>{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ?? "📦"}</span>
            {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category}
          </h3>
          <div className="space-y-1">
            {categoryItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                  item.packed && "bg-muted/30"
                )}
              >
                <Checkbox
                  checked={item.packed}
                  disabled={readOnly}
                  onCheckedChange={(checked) =>
                    handleToggle(item.id, checked === true)
                  }
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "font-medium",
                        item.packed && "text-muted-foreground line-through"
                      )}
                    >
                      {item.quantity > 1 && `${item.quantity}× `}
                      {item.item_name}
                    </span>
                    {item.shared && (
                      <Badge variant="secondary" className="text-xs">
                        Shared
                      </Badge>
                    )}
                    {item.traveler_id && (
                      <Badge variant="outline" className="text-xs">
                        {travelerMap[item.traveler_id]}
                      </Badge>
                    )}
                    {item.activity_name && (
                      <Badge variant="outline" className="text-xs">
                        {item.activity_name}
                      </Badge>
                    )}
                  </div>
                  {!readOnly && (
                    <Input
                      placeholder="Add notes..."
                      defaultValue={item.notes ?? ""}
                      onBlur={(e) => {
                        if (e.target.value !== (item.notes ?? "")) {
                          handleNotes(item.id, e.target.value);
                        }
                      }}
                      className="mt-2 h-7 border-0 bg-transparent px-0 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
