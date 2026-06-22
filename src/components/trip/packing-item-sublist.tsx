"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Backpack, Plus, X } from "lucide-react";
import { getOrCreateGearItem } from "@/actions/gear";
import { addPackingItem, removePackingItem } from "@/actions/packing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { gearPillClassName } from "@/lib/gear/infer-color";
import {
  gearMatchesParentLine,
  inferSubcategory,
  subcategoryLabel,
} from "@/lib/gear/subcategory";
import type { GearItem, PackingItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PackingItemSublistProps {
  tripId: string;
  parent: PackingItem;
  children: PackingItem[];
  gearItems: GearItem[];
  readOnly?: boolean;
}

export function PackingItemSublist({
  tripId,
  parent,
  children,
  gearItems,
  readOnly,
}: PackingItemSublistProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  const gearById = useMemo(
    () => Object.fromEntries(gearItems.map((g) => [g.id, g])),
    [gearItems]
  );

  const parentSubcategory = useMemo(
    () => inferSubcategory(parent.item_name, parent.category),
    [parent.item_name, parent.category]
  );

  const categoryGear = useMemo(
    () =>
      gearItems.filter(
        (g) =>
          g.category === parent.category &&
          gearMatchesParentLine(g, parent.item_name, parent.category)
      ),
    [gearItems, parent.category, parent.item_name]
  );

  const usedGearIds = useMemo(
    () => new Set(children.map((c) => c.gear_item_id).filter(Boolean)),
    [children]
  );

  const usedNames = useMemo(
    () => new Set(children.map((c) => c.item_name.toLowerCase())),
    [children]
  );

  const availableGear = categoryGear.filter(
    (g) => !usedGearIds.has(g.id) && !usedNames.has(g.item_name.toLowerCase())
  );

  const addFromGear = (gear: GearItem) => {
    if (usedGearIds.has(gear.id) || usedNames.has(gear.item_name.toLowerCase())) return;

    startTransition(async () => {
      await addPackingItem(tripId, gear.item_name, parent.traveler_id, {
        category: parent.category,
        parent_item_id: parent.id,
        gear_item_id: gear.id,
        shared: parent.shared,
      });
      router.refresh();
    });
  };

  const addNewItem = (itemName: string) => {
    const trimmed = itemName.trim();
    if (!trimmed) return;
    if (usedNames.has(trimmed.toLowerCase())) return;

    startTransition(async () => {
      const gearItem = await getOrCreateGearItem({
        item_name: trimmed,
        category: parent.category,
        parent_item_name: parent.item_name,
      });

      await addPackingItem(tripId, gearItem.item_name, parent.traveler_id, {
        category: parent.category,
        parent_item_id: parent.id,
        gear_item_id: gearItem.id,
        shared: parent.shared,
      });
      setDraft("");
      router.refresh();
    });
  };

  const removeChild = (childId: string) => {
    startTransition(async () => {
      await removePackingItem(tripId, childId);
      router.refresh();
    });
  };

  if (readOnly && children.length === 0) return null;

  return (
    <div className="ml-9 mt-2 border-l-2 border-primary/15 pl-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Which ones?
      </p>

      {children.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-1.5">
          {children.map((child) => {
            const gear = child.gear_item_id ? gearById[child.gear_item_id] : null;
            return (
              <li
                key={child.id}
                className={cn(
                  "group inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  gearPillClassName(gear?.color)
                )}
              >
                <span className="truncate">{child.item_name}</span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeChild(child.id)}
                    disabled={isPending}
                    className="shrink-0 cursor-pointer rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
                    aria-label={`Remove ${child.item_name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && (
        <div className="space-y-2.5 rounded-xl border bg-muted/20 p-2.5">
          {availableGear.length > 0 ? (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Backpack className="h-3.5 w-3.5 text-primary" />
                Pick from My Gear
                {parentSubcategory && (
                  <span className="font-normal text-muted-foreground">
                    · {subcategoryLabel(parentSubcategory)}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableGear.map((gear) => (
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
          ) : categoryGear.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              All matching {subcategoryLabel(parentSubcategory).toLowerCase()} are already listed.
            </p>
          ) : parentSubcategory ? (
            <p className="text-xs text-muted-foreground">
              No saved {subcategoryLabel(parentSubcategory).toLowerCase()} in My Gear yet. Add
              below or on the{" "}
              <Link href="/gear" className="font-medium text-primary hover:underline">
                My Gear page
              </Link>
              .
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              No saved items in this category yet.{" "}
              <Link href="/gear" className="font-medium text-primary hover:underline">
                Add to My Gear
              </Link>
            </p>
          )}

          <div className="border-t border-border/60 pt-2.5">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Or add something new</p>
            <div className="flex gap-1.5">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. orange v neck..."
                disabled={isPending}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNewItem(draft);
                  }
                }}
                className="h-8 flex-1 border-muted-foreground/20 bg-background text-sm"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addNewItem(draft)}
                disabled={isPending || !draft.trim()}
                className="h-8 shrink-0 rounded-full px-3"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">New items are saved to My Gear automatically.</p>
          </div>
        </div>
      )}

      {children.length === 0 && readOnly && (
        <p className="text-xs text-muted-foreground">No specific items listed.</p>
      )}
    </div>
  );
}
