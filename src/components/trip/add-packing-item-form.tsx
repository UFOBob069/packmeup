"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addPackingItem } from "@/actions/packing";
import type { GearItem, PackingCategory, Traveler } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

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
  const [selectedGearId, setSelectedGearId] = useState("");
  const [category, setCategory] = useState<PackingCategory>("miscellaneous");
  const [assignTo, setAssignTo] = useState<string>("shared");
  const [isPending, startTransition] = useTransition();

  const groupedGear = useMemo(() => {
    return gearItems.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<PackingCategory, GearItem[]>
    );
  }, [gearItems]);

  const gearCategories = CATEGORY_ORDER.filter((c) => groupedGear[c]?.length);

  const handleGearSelect = (gearId: string) => {
    setSelectedGearId(gearId);
    const gear = gearItems.find((g) => g.id === gearId);
    if (gear) {
      setName(gear.item_name);
      setCategory(gear.category);
    } else {
      setCategory("miscellaneous");
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    const match = gearItems.find(
      (g) => g.item_name.toLowerCase() === value.trim().toLowerCase()
    );
    if (match) {
      setSelectedGearId(match.id);
      setCategory(match.category);
    } else {
      setSelectedGearId("");
      setCategory("miscellaneous");
    }
  };

  const resetForm = () => {
    setName("");
    setSelectedGearId("");
    setCategory("miscellaneous");
  };

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const travelerId = assignTo === "shared" ? null : assignTo;
    startTransition(async () => {
      await addPackingItem(tripId, trimmed, travelerId, { category });
      resetForm();
      router.refresh();
    });
  };

  return (
    <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
      <p className="mb-3 text-sm font-medium">Add to packing list</p>

      <div className="space-y-3">
        {gearItems.length > 0 ? (
          <div>
            <label htmlFor="gear-select" className="mb-1.5 block text-xs text-muted-foreground">
              From My Gear
            </label>
            <select
              id="gear-select"
              value={selectedGearId}
              onChange={(e) => handleGearSelect(e.target.value)}
              disabled={isPending}
              className="w-full cursor-pointer rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">Choose a saved item...</option>
              {gearCategories.map((cat) => (
                <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
                  {groupedGear[cat].map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.item_name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No saved gear yet.{" "}
            <Link href="/gear" className="font-medium text-primary hover:underline">
              Add items to My Gear
            </Link>{" "}
            to reuse them here.
          </p>
        )}

        <div>
          <label htmlFor="item-name" className="mb-1.5 block text-xs text-muted-foreground">
            {gearItems.length > 0 ? "Or type a new item" : "Item name"}
          </label>
          <Input
            id="item-name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Sun hat, Blue Nike Polo..."
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="assign-to" className="mb-1.5 block text-xs text-muted-foreground">
              Assign to
            </label>
            <select
              id="assign-to"
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              disabled={isPending}
              className="w-full cursor-pointer rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="shared">Shared</option>
              {travelers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.traveler_type === "pet" ? " (pet)" : ""}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={handleAdd}
            disabled={isPending || !name.trim()}
            className="w-full shrink-0 rounded-full sm:w-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add to list
          </Button>
        </div>
      </div>
    </div>
  );
}
