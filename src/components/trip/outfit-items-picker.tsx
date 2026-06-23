"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Backpack, Plus, X } from "lucide-react";
import { getOrCreateGearItem } from "@/actions/gear";
import { updateOutfit } from "@/actions/packing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { gearPillClassName } from "@/lib/gear/infer-color";
import {
  gearMatchesParentLine,
  inferSubcategory,
  subcategoryLabel,
} from "@/lib/gear/subcategory";
import type { GearItem, PackingCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

const OUTFIT_CATEGORIES: PackingCategory[] = [
  "clothing",
  "shoes",
  "activity_gear",
  "miscellaneous",
];

interface OutfitItemsPickerProps {
  tripId: string;
  outfitId: string;
  items: string[];
  gearItems: GearItem[];
  filterHint?: string;
  disabled?: boolean;
}

export function OutfitItemsPicker({
  tripId,
  outfitId,
  items,
  gearItems,
  filterHint,
  disabled,
}: OutfitItemsPickerProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<PackingCategory>("clothing");
  const [isPending, startTransition] = useTransition();

  const gearByName = useMemo(() => {
    const map = new Map<string, GearItem>();
    gearItems.forEach((g) => map.set(g.item_name.toLowerCase(), g));
    return map;
  }, [gearItems]);

  const filterSubcategory = useMemo(
    () => (filterHint ? inferSubcategory(filterHint, "clothing") : null),
    [filterHint]
  );

  const matchingGear = useMemo(() => {
    const used = new Set(items.map((i) => i.toLowerCase()));
    return gearItems.filter((g) => {
      if (!OUTFIT_CATEGORIES.includes(g.category)) return false;
      if (used.has(g.item_name.toLowerCase())) return false;
      if (filterHint && g.category === "clothing") {
        return gearMatchesParentLine(g, filterHint, "clothing");
      }
      return true;
    });
  }, [gearItems, items, filterHint]);

  const saveItems = (next: string[]) => {
    startTransition(async () => {
      await updateOutfit(tripId, outfitId, { items: next });
      router.refresh();
    });
  };

  const addFromGear = (gear: GearItem) => {
    if (items.some((i) => i.toLowerCase() === gear.item_name.toLowerCase())) return;
    saveItems([...items, gear.item_name]);
  };

  const addGeneric = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (items.some((i) => i.toLowerCase() === trimmed.toLowerCase())) return;
    saveItems([...items, trimmed]);
    setDraft("");
  };

  const addNewToGear = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (items.some((i) => i.toLowerCase() === trimmed.toLowerCase())) return;

    startTransition(async () => {
      await getOrCreateGearItem({
        item_name: trimmed,
        category,
        parent_item_name: filterHint,
      });
      await updateOutfit(tripId, outfitId, { items: [...items, trimmed] });
      setDraft("");
      router.refresh();
    });
  };

  const removeItem = (index: number) => {
    saveItems(items.filter((_, i) => i !== index));
  };

  if (disabled && items.length === 0) {
    return <p className="text-xs text-muted-foreground">No items selected.</p>;
  }

  return (
    <div className="space-y-2.5">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, index) => {
            const gear = gearByName.get(item.toLowerCase());
            return (
              <span
                key={`${item}-${index}`}
                className={cn(
                  "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  gear ? gearPillClassName(gear.color) : "bg-muted/40"
                )}
              >
                <span className="truncate">{item}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={isPending}
                    className="shrink-0 cursor-pointer rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
                    aria-label={`Remove ${item}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {!disabled && (
        <div className="space-y-2.5 rounded-xl border bg-muted/20 p-2.5">
          {matchingGear.length > 0 ? (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Backpack className="h-3.5 w-3.5 text-primary" />
                Pick from My Gear
                {filterSubcategory && (
                  <span className="font-normal text-muted-foreground">
                    · {subcategoryLabel(filterSubcategory)}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {matchingGear.map((gear) => (
                  <button
                    key={gear.id}
                    type="button"
                    disabled={isPending}
                    onClick={() => addFromGear(gear)}
                    className={cn(
                      "cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                      "hover:scale-[1.02] hover:shadow-sm active:scale-[0.98]",
                      gearPillClassName(gear.color)
                    )}
                  >
                    {gear.item_name}
                  </button>
                ))}
              </div>
            </div>
          ) : gearItems.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              No matching saved items — add a generic item below or on{" "}
              <Link href="/gear" className="font-medium text-primary hover:underline">
                My Gear
              </Link>
              .
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              No saved gear yet.{" "}
              <Link href="/gear" className="font-medium text-primary hover:underline">
                Add to My Gear
              </Link>
            </p>
          )}

          <div className="border-t border-border/60 pt-2.5">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Or add a general item
            </p>
            <div className="flex flex-wrap gap-1.5">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PackingCategory)}
                disabled={isPending}
                className="h-8 cursor-pointer rounded-lg border border-muted-foreground/20 bg-background px-2 text-xs"
              >
                {OUTFIT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. golf shirts..."
                disabled={isPending}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addGeneric(draft);
                  }
                }}
                className="h-8 min-w-[140px] flex-1 border-muted-foreground/20 bg-background text-sm"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addGeneric(draft)}
                disabled={isPending || !draft.trim()}
                className="h-8 shrink-0 rounded-full px-3"
              >
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => addNewToGear(draft)}
                disabled={isPending || !draft.trim()}
                className="h-8 shrink-0 rounded-full px-3"
                title="Save to My Gear and add to this event"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Save to Gear
              </Button>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              &quot;Add&quot; keeps it generic for this day. &quot;Save to Gear&quot; adds it to My Gear too.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
