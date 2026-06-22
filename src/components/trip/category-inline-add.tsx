"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addPackingItem } from "@/actions/packing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GearItem, PackingCategory } from "@/lib/types";

interface CategoryInlineAddProps {
  tripId: string;
  category: PackingCategory;
  categoryLabel: string;
  gearItems: GearItem[];
  filterTraveler?: string | null;
}

function resolveTravelerId(filterTraveler?: string | null): string | null {
  if (!filterTraveler || filterTraveler === "shared") return null;
  return filterTraveler;
}

export function CategoryInlineAdd({
  tripId,
  category,
  categoryLabel,
  gearItems,
  filterTraveler,
}: CategoryInlineAddProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedGearId, setSelectedGearId] = useState("");
  const [isPending, startTransition] = useTransition();

  const categoryGear = gearItems.filter((g) => g.category === category);
  const travelerId = resolveTravelerId(filterTraveler);

  const addItem = (itemName: string) => {
    const trimmed = itemName.trim();
    if (!trimmed) return;

    startTransition(async () => {
      await addPackingItem(tripId, trimmed, travelerId, { category });
      setName("");
      setSelectedGearId("");
      router.refresh();
    });
  };

  const handleGearSelect = (gearId: string) => {
    setSelectedGearId(gearId);
    const gear = categoryGear.find((g) => g.id === gearId);
    if (gear) addItem(gear.item_name);
  };

  return (
    <div className="rounded-xl border border-dashed bg-muted/15 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Add ${categoryLabel.toLowerCase()}...`}
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem(name);
            }
          }}
          className="flex-1 border-muted-foreground/20 bg-background"
        />

        {categoryGear.length > 0 && (
          <select
            value={selectedGearId}
            onChange={(e) => handleGearSelect(e.target.value)}
            disabled={isPending}
            className="w-full cursor-pointer rounded-md border bg-background px-3 py-2 text-sm sm:w-44"
          >
            <option value="">From My Gear</option>
            {categoryGear.map((item) => (
              <option key={item.id} value={item.id}>
                {item.item_name}
              </option>
            ))}
          </select>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => addItem(name)}
          disabled={isPending || !name.trim()}
          className="shrink-0 rounded-full"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}
