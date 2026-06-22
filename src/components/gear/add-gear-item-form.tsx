"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { saveToMyGear } from "@/actions/gear";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PackingCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

const CATEGORIES: PackingCategory[] = [
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

export function AddGearItemForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PackingCategory>("clothing");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter an item name");
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveToMyGear({
          item_name: trimmed,
          category,
          description: description.trim() || null,
        });
        if (result.alreadyExists) {
          toast.info(`"${trimmed}" is already in My Gear`);
        } else {
          toast.success(`Added "${trimmed}" to My Gear`);
          setName("");
          setDescription("");
        }
        router.refresh();
      } catch {
        toast.error("Could not add item");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
      <p className="mb-3 text-sm font-medium">Add to My Gear</p>
      <div className="space-y-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Blue Nike Polo, Anker Charger..."
          disabled={isPending}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PackingCategory)}
            disabled={isPending}
            className="flex-1 cursor-pointer rounded-md border bg-background px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional note"
            disabled={isPending}
            className="flex-1"
          />
        </div>
        <Button
          onClick={handleAdd}
          disabled={isPending || !name.trim()}
          className="w-full rounded-full sm:w-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add item
        </Button>
      </div>
    </div>
  );
}
