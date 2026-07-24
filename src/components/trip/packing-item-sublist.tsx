"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";
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
    <div className="mt-3 space-y-2 border-t border-dashed border-border/70 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Which ones?
      </p>

      {children.length > 0 && (
        <ul className="space-y-1.5">
          {children.map((child) => {
            const gear = child.gear_item_id ? gearById[child.gear_item_id] : null;
            return (
              <li
                key={child.id}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
                  gearPillClassName(gear?.color)
                )}
              >
                <span className="min-w-0 flex-1 truncate">{child.item_name}</span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeChild(child.id)}
                    disabled={isPending}
                    className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-background/80 hover:text-destructive"
                    aria-label={`Remove ${child.item_name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && (
        <div className="space-y-2">
          {availableGear.length > 0 ? (
            <ul className="space-y-1.5">
              {availableGear.map((gear) => (
                <li
                  key={gear.id}
                  className="flex min-h-11 items-center gap-3 rounded-xl border bg-background px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {gear.item_name}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => addFromGear(gear)}
                    className="h-8 shrink-0 cursor-pointer rounded-full border-primary/30 px-3 text-primary hover:bg-primary/5 hover:text-primary"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          ) : categoryGear.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              All matching {subcategoryLabel(parentSubcategory).toLowerCase()} are already listed.
            </p>
          ) : parentSubcategory ? (
            <p className="text-xs text-muted-foreground">
              No saved {subcategoryLabel(parentSubcategory).toLowerCase()} in your closet yet. Add
              below or on the{" "}
              <Link href="/gear" className="font-medium text-primary hover:underline">
                closet page
              </Link>
              .
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nothing saved in this category yet.{" "}
              <Link href="/gear" className="font-medium text-primary hover:underline">
                Add to your closet
              </Link>
            </p>
          )}

          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-dashed bg-muted/20 p-2">
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
              className="h-8 min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addNewItem(draft)}
              disabled={isPending || !draft.trim()}
              className="h-8 shrink-0 cursor-pointer rounded-full border-primary/30 px-3 text-primary hover:bg-primary/5"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            New items are saved to your closet automatically.
          </p>
        </div>
      )}

      {children.length === 0 && readOnly && (
        <p className="text-xs text-muted-foreground">No specific items listed.</p>
      )}
    </div>
  );
}
