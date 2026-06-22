"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addPackingItem } from "@/actions/packing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PackingCategory } from "@/lib/types";

interface CategoryInlineAddProps {
  tripId: string;
  category: PackingCategory;
  categoryLabel: string;
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
  filterTraveler,
}: CategoryInlineAddProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const travelerId = resolveTravelerId(filterTraveler);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    startTransition(async () => {
      await addPackingItem(tripId, trimmed, travelerId, { category });
      setName("");
      router.refresh();
    });
  };

  return (
    <div className="rounded-xl border border-dashed bg-muted/15 p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Add {categoryLabel.toLowerCase()}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`e.g. 10 shirts, golf shorts...`}
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          className="flex-1 border-muted-foreground/20 bg-background"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={isPending || !name.trim()}
          className="shrink-0 rounded-full"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Then pick which specific items below each line from My Gear.
      </p>
    </div>
  );
}
