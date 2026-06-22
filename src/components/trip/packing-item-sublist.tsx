"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { addPackingItem, removePackingItem } from "@/actions/packing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  const categoryGear = useMemo(
    () => gearItems.filter((g) => g.category === parent.category),
    [gearItems, parent.category]
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

  const addSpecific = (itemName: string, gearItemId?: string) => {
    const trimmed = itemName.trim();
    if (!trimmed) return;

    const gear = gearItemId
      ? categoryGear.find((g) => g.id === gearItemId)
      : categoryGear.find((g) => g.item_name.toLowerCase() === trimmed.toLowerCase());

    if (gear && usedGearIds.has(gear.id)) return;
    if (!gear && usedNames.has(trimmed.toLowerCase())) return;

    startTransition(async () => {
      await addPackingItem(tripId, gear?.item_name ?? trimmed, parent.traveler_id, {
        category: parent.category,
        parent_item_id: parent.id,
        gear_item_id: gear?.id ?? null,
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
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Which ones?
      </p>

      {children.length > 0 && (
        <ul className="mb-2 space-y-1">
          {children.map((child) => (
            <li
              key={child.id}
              className="group flex items-center gap-2 rounded-lg bg-muted/30 px-2 py-1.5 text-sm"
            >
              <span className="min-w-0 flex-1 truncate font-medium">{child.item_name}</span>
              {child.gear_item_id && (
                <span className="shrink-0 text-[10px] text-muted-foreground">My Gear</span>
              )}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeChild(child.id)}
                  disabled={isPending}
                  className="shrink-0 cursor-pointer rounded p-0.5 text-muted-foreground opacity-70 transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  aria-label={`Remove ${child.item_name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              list={availableGear.length > 0 ? `gear-options-${parent.id}` : undefined}
              placeholder={
                availableGear.length > 0
                  ? "Pick from My Gear or type..."
                  : "Type a specific item..."
              }
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSpecific(draft);
                }
              }}
              className="h-8 border-muted-foreground/20 bg-background text-sm"
            />
            {availableGear.length > 0 && (
              <datalist id={`gear-options-${parent.id}`}>
                {availableGear.map((g) => (
                  <option key={g.id} value={g.item_name} />
                ))}
              </datalist>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => addSpecific(draft)}
            disabled={isPending || !draft.trim()}
            className={cn("h-8 shrink-0 rounded-full px-3")}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </div>
      )}

      {children.length === 0 && readOnly && (
        <p className="text-xs text-muted-foreground">No specific items listed.</p>
      )}
    </div>
  );
}
