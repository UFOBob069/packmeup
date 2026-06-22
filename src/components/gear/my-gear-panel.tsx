"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Backpack, Pencil, Search, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { deleteMyGearItem, updateMyGearItem } from "@/actions/gear";
import { AddGearItemForm } from "@/components/gear/add-gear-item-form";
import { CATEGORY_ICONS } from "@/lib/constants";
import type { GearItem, PackingCategory } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

interface MyGearPanelProps {
  items: GearItem[];
  compact?: boolean;
  className?: string;
  showAddForm?: boolean;
}

export function MyGearPanel({ items, compact, className, showAddForm }: MyGearPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.item_name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        CATEGORY_LABELS[item.category].toLowerCase().includes(q)
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    return filtered.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<PackingCategory, GearItem[]>
    );
  }, [filtered]);

  const categories = CATEGORY_ORDER.filter((c) => grouped[c]?.length);

  const startEdit = (item: GearItem) => {
    setEditingId(item.id);
    setEditName(item.item_name);
    setEditDescription(item.description ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const saveEdit = (itemId: string) => {
    const name = editName.trim();
    if (!name) {
      toast.error("Item name is required");
      return;
    }
    startTransition(async () => {
      try {
        await updateMyGearItem(itemId, {
          item_name: name,
          description: editDescription.trim() || null,
        });
        cancelEdit();
        router.refresh();
        toast.success("Item updated");
      } catch {
        toast.error("Could not update item");
      }
    });
  };

  const handleDelete = (item: GearItem) => {
    if (!window.confirm(`Remove "${item.item_name}" from My Gear?`)) return;
    startTransition(async () => {
      try {
        await deleteMyGearItem(item.id);
        if (editingId === item.id) cancelEdit();
        router.refresh();
        toast.success("Removed from My Gear");
      } catch {
        toast.error("Could not delete item");
      }
    });
  };

  const showForm = showAddForm ?? !compact;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card shadow-travel-sm",
        compact ? "p-4" : "p-5",
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Backpack className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-display text-base font-semibold">My Gear</h2>
            <p className="text-xs text-muted-foreground">
              Saved items to reuse on future trips
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {compact && (
            <Link
              href="/gear"
              className="shrink-0 text-xs font-medium text-primary transition-colors hover:underline"
            >
              View all
            </Link>
          )}
          {items.length > 0 && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {items.length}
            </span>
          )}
        </div>
      </div>

      {showForm && (
        <div className="mb-4">
          <AddGearItemForm />
        </div>
      )}

      {items.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search gear..."
            className="pl-9"
          />
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-center">
          <p className="text-sm font-medium">No saved gear yet</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {showForm ? (
              <>Use the form above to add your first item.</>
            ) : (
              <>
                Add items on the{" "}
                <Link href="/gear" className="font-medium text-primary hover:underline">
                  My Gear page
                </Link>
                , or tap &ldquo;Save to My Gear&rdquo; on any packing list item.
              </>
            )}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No matches for &ldquo;{query}&rdquo;</p>
      ) : (
        <div className={cn("space-y-4", compact && "max-h-80 overflow-y-auto pr-1")}>
          {categories.map((category) => (
            <div key={category}>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <span>{CATEGORY_ICONS[category]}</span>
                {CATEGORY_LABELS[category]}
              </p>
              <ul className="space-y-2">
                {grouped[category].map((item) => (
                  <li
                    key={item.id}
                    className="group rounded-xl border bg-background p-3 transition-colors hover:bg-muted/30"
                  >
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Item name"
                          disabled={isPending}
                        />
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Optional note"
                          disabled={isPending}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={cancelEdit}
                            disabled={isPending}
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => saveEdit(item.id)}
                            disabled={isPending}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">{item.item_name}</p>
                          {item.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={`Edit ${item.item_name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Delete ${item.item_name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
