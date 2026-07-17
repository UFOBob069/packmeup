"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { saveToMyGroup } from "@/actions/group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PetSize, PetSpecies, TravelerType } from "@/lib/types";

const TRAVELER_TYPES: { value: TravelerType; label: string }[] = [
  { value: "adult", label: "Adult" },
  { value: "child", label: "Child" },
  { value: "infant", label: "Infant" },
  { value: "pet", label: "Pet" },
];

const PET_SPECIES: { value: PetSpecies; label: string }[] = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "other", label: "Other" },
];

const PET_SIZES: { value: PetSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export function AddGroupMemberForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [travelerType, setTravelerType] = useState<TravelerType>("adult");
  const [petSpecies, setPetSpecies] = useState<PetSpecies>("dog");
  const [petSize, setPetSize] = useState<PetSize>("medium");
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter a name");
      return;
    }

    startTransition(async () => {
      try {
        const { alreadyExists } = await saveToMyGroup({
          name: trimmed,
          traveler_type: travelerType,
          pet_species: travelerType === "pet" ? petSpecies : null,
          pet_size: travelerType === "pet" ? petSize : null,
        });
        setName("");
        router.refresh();
        toast.success(alreadyExists ? "Already in My Group" : "Added to My Group");
      } catch {
        toast.error("Could not add to My Group");
      }
    });
  };

  return (
    <div className="rounded-xl border border-dashed bg-muted/15 p-4">
      <p className="mb-3 text-sm font-medium">Add someone to My Group</p>
      <div className="flex flex-wrap gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          disabled={isPending}
          className="min-w-[120px] flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <select
          value={travelerType}
          onChange={(e) => setTravelerType(e.target.value as TravelerType)}
          disabled={isPending}
          className="h-9 cursor-pointer rounded-md border bg-background px-2 text-sm"
        >
          {TRAVELER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {travelerType === "pet" && (
          <>
            <select
              value={petSpecies}
              onChange={(e) => setPetSpecies(e.target.value as PetSpecies)}
              disabled={isPending}
              className="h-9 cursor-pointer rounded-md border bg-background px-2 text-sm"
            >
              {PET_SPECIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={petSize}
              onChange={(e) => setPetSize(e.target.value as PetSize)}
              disabled={isPending}
              className="h-9 cursor-pointer rounded-md border bg-background px-2 text-sm"
            >
              {PET_SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </>
        )}
        <Button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !name.trim()}
          className="cursor-pointer rounded-full"
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}
