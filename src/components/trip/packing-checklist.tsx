"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Trash2, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PackingCategory, PackingItem, Traveler } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/constants";
import { toggleItemPacked, updateItemNotes, removePackingItem } from "@/actions/packing";
import { saveToMyGear } from "@/actions/gear";
import { TravelerAvatar } from "@/components/design/traveler-avatar";

const CATEGORY_ORDER: PackingCategory[] = [
  "clothing",
  "shoes",
  "toiletries",
  "electronics",
  "travel_documents",
  "medications",
  "activity_gear",
  "pet_supplies",
  "miscellaneous",
];

interface PackingChecklistProps {
  items: PackingItem[];
  travelers: Traveler[];
  tripId: string;
  filterTraveler?: string | null;
  filterActivity?: string | null;
  readOnly?: boolean;
  savedGearNames?: string[];
}

export function PackingChecklist({
  items,
  travelers,
  tripId,
  filterTraveler,
  filterActivity,
  readOnly,
  savedGearNames = [],
}: PackingChecklistProps) {
  const router = useRouter();
  const [localItems, setLocalItems] = useState(items);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [savedNames, setSavedNames] = useState(() => new Set(savedGearNames));

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  useEffect(() => {
    setSavedNames(new Set(savedGearNames));
  }, [savedGearNames]);

  let filtered = localItems;
  if (filterTraveler === "shared") {
    filtered = localItems.filter((i) => i.shared);
  } else if (filterTraveler) {
    filtered = localItems.filter((i) => i.traveler_id === filterTraveler);
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

  const categories = CATEGORY_ORDER.filter((c) => grouped[c]?.length).concat(
    Object.keys(grouped).filter(
      (c) => !CATEGORY_ORDER.includes(c as PackingCategory)
    ) as PackingCategory[]
  );

  const categoryKey = categories.join(",");

  useEffect(() => {
    if (categories.length === 0) {
      setExpandedCategory(null);
      return;
    }
    setExpandedCategory((prev) =>
      prev && categories.includes(prev as PackingCategory) ? prev : categories[0]
    );
  }, [categoryKey, categories.length]);

  const travelerMap = Object.fromEntries(travelers.map((t) => [t.id, t]));
  const travelerIndex = Object.fromEntries(travelers.map((t, i) => [t.id, i]));

  const handleToggle = (itemId: string, packed: boolean) => {
    setLocalItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, packed } : i))
    );
    startTransition(async () => {
      await toggleItemPacked(tripId, itemId, packed);
      router.refresh();
    });
  };

  const handleRemove = (itemId: string) => {
    setLocalItems((prev) => prev.filter((i) => i.id !== itemId));
    startTransition(async () => {
      await removePackingItem(tripId, itemId);
      router.refresh();
    });
  };

  const handleSaveToGear = (item: PackingItem) => {
    startTransition(async () => {
      try {
        const result = await saveToMyGear({
          item_name: item.item_name,
          category: item.category,
          description: item.notes,
        });
        if (result.alreadyExists) {
          toast.info("Already in My Gear");
          setSavedNames((prev) => new Set(prev).add(item.item_name.toLowerCase()));
        } else {
          toast.success("Saved to My Gear");
          setSavedNames((prev) => new Set(prev).add(item.item_name.toLowerCase()));
          router.refresh();
        }
      } catch {
        toast.error("Could not save to My Gear");
      }
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  };

  if (filtered.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Nothing here yet — your list will appear as you pack.
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", isPending && "opacity-80")}>
      {categories.map((category) => {
        const categoryItems = grouped[category];
        const packedCount = categoryItems.filter((i) => i.packed).length;
        const isExpanded = expandedCategory === category;
        const label =
          CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;

        return (
          <section
            key={category}
            className="overflow-hidden rounded-2xl border bg-card shadow-travel-sm"
          >
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50"
              aria-expanded={isExpanded}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
                {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] ?? "📦"}
              </span>
              <span className="text-display min-w-0 flex-1 font-semibold">{label}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {packedCount} / {categoryItems.length} packed
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>

            {isExpanded && (
              <div className="space-y-2 border-t px-3 pb-3 pt-2">
                {categoryItems.map((item) => {
                  const traveler = item.traveler_id ? travelerMap[item.traveler_id] : null;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group flex items-start gap-3 rounded-xl border bg-background p-3.5 transition-all",
                        "hover:border-primary/20 hover:bg-muted/30 hover:shadow-travel-sm",
                        item.packed && "border-primary/10 bg-primary/[0.02]"
                      )}
                    >
                      <button
                        type="button"
                        disabled={readOnly}
                        onClick={() => handleToggle(item.id, !item.packed)}
                        className={cn(
                          "mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all",
                          item.packed
                            ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                            : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
                        )}
                        aria-label={item.packed ? "Mark unpacked" : "Mark packed"}
                      >
                        {item.packed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "font-medium",
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
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.shared
                            ? "Shared with everyone"
                            : traveler
                              ? `Assigned: ${traveler.name}`
                              : "Unassigned"}
                        </p>
                        {!readOnly && (
                          <input
                            placeholder="Add a note..."
                            defaultValue={item.notes ?? ""}
                            onBlur={(e) => {
                              if (e.target.value !== (item.notes ?? "")) {
                                startTransition(async () => {
                                  await updateItemNotes(tripId, item.id, e.target.value);
                                  router.refresh();
                                });
                              }
                            }}
                            className="mt-1.5 w-full cursor-text rounded-md border-0 bg-transparent px-1.5 py-1 text-xs text-muted-foreground transition-colors placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:bg-muted/50 focus:outline-none focus:ring-0"
                          />
                        )}
                        {!readOnly && !savedNames.has(item.item_name.toLowerCase()) && (
                          <button
                            type="button"
                            onClick={() => handleSaveToGear(item)}
                            disabled={isPending}
                            className="mt-1.5 inline-flex cursor-pointer items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/15 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <BookmarkPlus className="h-3 w-3" />
                            Save to My Gear
                          </button>
                        )}
                      </div>

                      {traveler && !item.shared && (
                        <TravelerAvatar
                          name={traveler.name}
                          type={traveler.traveler_type}
                          index={travelerIndex[traveler.id] ?? 0}
                          size="sm"
                        />
                      )}

                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Remove "${item.item_name}" from your packing list?`
                              )
                            ) {
                              handleRemove(item.id);
                            }
                          }}
                          className="shrink-0 cursor-pointer rounded-lg p-2 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive sm:opacity-60 sm:group-hover:opacity-100"
                          aria-label={`Remove ${item.item_name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
