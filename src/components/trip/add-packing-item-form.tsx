"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Backpack, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addPackingItem } from "@/actions/packing";
import type { GearItem, Traveler } from "@/lib/types";
import { CATEGORY_ICONS } from "@/lib/constants";

interface AddPackingItemFormProps {
  tripId: string;
  travelers: Traveler[];
  gearItems?: GearItem[];
}

export function AddPackingItemForm({
  tripId,
  travelers,
  gearItems = [],
}: AddPackingItemFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [assignTo, setAssignTo] = useState<string>("shared");
  const [showGear, setShowGear] = useState(false);
  const [isPending, startTransition] = useTransition();

  const groupedGear = useMemo(() => {
    return gearItems.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, GearItem[]>
    );
  }, [gearItems]);

  const addItem = (itemName: string, category?: GearItem["category"]) => {
    const trimmed = itemName.trim();
    if (!trimmed) return;

    const travelerId = assignTo === "shared" ? null : assignTo;
    startTransition(async () => {
      await addPackingItem(tripId, trimmed, travelerId, { category });
      router.refresh();
    });
  };

  const handleAdd = () => {
    addItem(name);
    setName("");
  };

  return (
    <div className="space-y-3">
      {gearItems.length > 0 && (
        <div className="rounded-2xl border bg-muted/20 p-4">
          <button
            type="button"
            onClick={() => setShowGear((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Backpack className="h-4 w-4 text-primary" />
              Add from My Gear
            </span>
            <span className="text-xs text-muted-foreground">
              {showGear ? "Hide" : `${gearItems.length} saved`}
            </span>
          </button>

          {showGear && (
            <div className="mt-3 space-y-3 border-t pt-3">
              {Object.entries(groupedGear).map(([category, items]) => (
                <div key={category}>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}{" "}
                    {category.replace(/_/g, " ")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          addItem(item.item_name, item.category)
                        }
                        className="rounded-full border bg-background px-3 py-1 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/5"
                      >
                        {item.item_name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
        <p className="mb-3 text-sm font-medium">Add something to your list</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sun hat, extra socks..."
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            disabled={isPending}
            className="flex-1"
          />
          <select
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            disabled={isPending}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="shared">Shared</option>
            {travelers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <Button onClick={handleAdd} disabled={isPending || !name.trim()} className="shrink-0">
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
