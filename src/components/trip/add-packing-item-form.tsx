"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addPackingItem } from "@/actions/packing";
import type { Traveler } from "@/lib/types";

interface AddPackingItemFormProps {
  tripId: string;
  travelers: Traveler[];
}

export function AddPackingItemForm({ tripId, travelers }: AddPackingItemFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [assignTo, setAssignTo] = useState<string>("shared");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const travelerId = assignTo === "shared" ? null : assignTo;
    setName("");
    startTransition(async () => {
      await addPackingItem(tripId, trimmed, travelerId);
      router.refresh();
    });
  };

  return (
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
              {t.traveler_type === "pet" ? " (pet)" : ""}
            </option>
          ))}
        </select>
        <Button onClick={handleAdd} disabled={isPending || !name.trim()}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
}
