"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Backpack, Plus, X } from "lucide-react";
import { getOrCreateGearItem } from "@/actions/gear";
import { syncGearToChecklist, updateOutfit } from "@/actions/packing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { gearPillClassName } from "@/lib/gear/infer-color";
import {
  gearMatchesParentLine,
  inferSubcategory,
  subcategoryLabel,
} from "@/lib/gear/subcategory";
import {
  normalizeOutfitItems,
  outfitItemKey,
  serializeOutfitItems,
} from "@/lib/outfit-items";
import type { GearItem, OutfitItem, PackingCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { CATEGORY_ITEM_PLACEHOLDERS } from "@/lib/gear/category-placeholders";
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
  items: OutfitItem[] | unknown;
  gearItems: GearItem[];
  filterHint?: string;
  activityName?: string | null;
  disabled?: boolean;
}

export function OutfitItemsPicker({
  tripId,
  outfitId,
  items: rawItems,
  gearItems,
  filterHint,
  activityName,
  disabled,
}: OutfitItemsPickerProps) {
  const router = useRouter();
  const items = useMemo(() => normalizeOutfitItems(rawItems), [rawItems]);
  const [draft, setDraft] = useState("");
  const [category, setCategory] = useState<PackingCategory>("clothing");
  const [isPending, startTransition] = useTransition();

  const gearById = useMemo(
    () => Object.fromEntries(gearItems.map((g) => [g.id, g])),
    [gearItems]
  );

  const filterSubcategory = useMemo(
    () => (filterHint ? inferSubcategory(filterHint, "clothing") : null),
    [filterHint]
  );

  const usedKeys = useMemo(() => new Set(items.map(outfitItemKey)), [items]);

  const matchingGear = useMemo(() => {
    return gearItems.filter((g) => {
      if (!OUTFIT_CATEGORIES.includes(g.category)) return false;
      if (usedKeys.has(g.id) || usedKeys.has(g.item_name.toLowerCase())) return false;
      if (filterHint && g.category === "clothing") {
        return gearMatchesParentLine(g, filterHint, "clothing");
      }
      return true;
    });
  }, [gearItems, usedKeys, filterHint]);

  const saveItems = (next: OutfitItem[], syncGear?: GearItem) => {
    startTransition(async () => {
      await updateOutfit(tripId, outfitId, { items: serializeOutfitItems(next) });
      if (syncGear) {
        await syncGearToChecklist(tripId, syncGear, { activity_name: activityName });
      }
      router.refresh();
    });
  };

  const addFromGear = (gear: GearItem) => {
    if (usedKeys.has(gear.id) || usedKeys.has(gear.item_name.toLowerCase())) return;
    const next: OutfitItem = {
      name: gear.item_name,
      gear_item_id: gear.id,
      category: gear.category,
    };
    saveItems([...items, next], gear);
  };

  const addGeneric = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (usedKeys.has(trimmed.toLowerCase())) return;
    const next: OutfitItem = { name: trimmed, category, day_only: true };
    saveItems([...items, next]);
    setDraft("");
  };

  const addNewToGear = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (usedKeys.has(trimmed.toLowerCase())) return;

    startTransition(async () => {
      const gearItem = await getOrCreateGearItem({
        item_name: trimmed,
        category,
        parent_item_name: filterHint,
      });
      const next: OutfitItem = {
        name: gearItem.item_name,
        gear_item_id: gearItem.id,
        category: gearItem.category,
      };
      await updateOutfit(tripId, outfitId, {
        items: serializeOutfitItems([...items, next]),
      });
      await syncGearToChecklist(tripId, gearItem, { activity_name: activityName });
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
            const gear = item.gear_item_id ? gearById[item.gear_item_id] : null;
            return (
              <span
                key={`${outfitItemKey(item)}-${index}`}
                className={cn(
                  "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  gear ? gearPillClassName(gear.color) : "bg-muted/40"
                )}
              >
                <span className="truncate">{item.name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={isPending}
                    className="shrink-0 cursor-pointer rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
                    aria-label={`Remove ${item.name}`}
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
                Pick from your closet
                {filterSubcategory && (
                  <span className="font-normal text-muted-foreground">
                    · {subcategoryLabel(filterSubcategory)}
                  </span>
                )}
              </p>
              <p className="mb-1.5 text-[10px] text-muted-foreground">
                Adds to this day and your packing checklist.
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
              No matching saved items — add a generic item below or in{" "}
              <Link href="/gear" className="font-medium text-primary hover:underline">
                your closet
              </Link>
              .
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nothing saved yet.{" "}
              <Link href="/gear" className="font-medium text-primary hover:underline">
                Add to your closet
              </Link>
            </p>
          )}

          <div className="border-t border-border/60 pt-2.5">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Not in your closet? Add an item
            </p>
            <div className="flex flex-wrap gap-1.5">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PackingCategory)}
                disabled={isPending}
                className="h-8 cursor-pointer rounded-lg border border-muted-foreground/20 bg-background px-2 text-xs"
                aria-label="Item category"
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
                placeholder={CATEGORY_ITEM_PLACEHOLDERS[category]}
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
                title="Day plan only — not added to checklist or closet"
              >
                This day only
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => addNewToGear(draft)}
                disabled={isPending || !draft.trim()}
                className="h-8 shrink-0 rounded-full px-3"
                title="Save to your closet, day plan, and packing checklist"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Save to closet
              </Button>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              <span className="font-medium text-foreground/80">This day only</span> — not on your
              checklist. <span className="font-medium text-foreground/80">Save to closet</span> —
              checklist + closet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
