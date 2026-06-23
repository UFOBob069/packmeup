import type { GearItem, PackingItem, PackingCategory, Traveler } from "@/lib/types";
import { inferSubcategory, resolveGearSubcategory } from "@/lib/gear/subcategory";

export function defaultHumanTraveler(travelers: Traveler[]): Traveler | null {
  return travelers.find((t) => t.traveler_type !== "pet") ?? travelers[0] ?? null;
}

export function packingItemHasGear(
  items: PackingItem[],
  gearItemId: string
): boolean {
  return items.some((i) => i.gear_item_id === gearItemId);
}

export function findParentLineForGear(
  packingItems: PackingItem[],
  gear: Pick<GearItem, "item_name" | "category"> & { subcategory?: string | null }
): PackingItem | null {
  if (gear.category !== "clothing") return null;

  const gearSub = resolveGearSubcategory(gear);
  if (!gearSub) return null;

  return (
    packingItems.find(
      (item) =>
        !item.parent_item_id &&
        item.category === gear.category &&
        inferSubcategory(item.item_name, item.category) === gearSub
    ) ?? null
  );
}

export interface SyncGearInput {
  id: string;
  item_name: string;
  category: PackingCategory;
  subcategory?: string | null;
}

export interface SyncGearResult {
  added: boolean;
  parent_item_id: string | null;
  reason?: "already_on_list";
}

export function planGearChecklistPlacement(
  packingItems: PackingItem[],
  gear: SyncGearInput
): { parent_item_id: string | null } {
  const parent = findParentLineForGear(packingItems, gear);
  return { parent_item_id: parent?.id ?? null };
}
