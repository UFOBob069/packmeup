"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addPackingItem } from "@/actions/packing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PackingCategory } from "@/lib/types";
import { CATEGORY_LINE_PLACEHOLDERS } from "@/lib/gear/category-placeholders";

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
      <div className="flex min-h-11 items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={CATEGORY_LINE_PLACEHOLDERS[category]}
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          className="h-9 min-w-0 flex-1 border-muted-foreground/20 bg-background"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAdd}
          disabled={isPending || !name.trim()}
          className="h-9 shrink-0 cursor-pointer rounded-full border-primary/30 px-3 text-primary hover:bg-primary/5"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Adds a line to your list — then pick specifics from your closet under it.
      </p>
    </div>
  );
}
