import type { GearItem, PackingCategory, PackingItem } from "@/lib/types";
import {
  CLOTHING_SUBCATEGORIES,
  inferSubcategory,
  subcategoryLabel,
  type ClothingSubcategory,
} from "@/lib/gear/subcategory";

type PackingDraft = Omit<PackingItem, "id" | "trip_id" | "created_at" | "updated_at">;
export type PackingDraftWithId = PackingDraft & { id: string };

function newId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `pack-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function parentKey(
  category: PackingCategory,
  subcategory: string | null,
  travelerId: string | null,
  shared: boolean
): string {
  return `${category}|${subcategory ?? "generic"}|${shared ? "shared" : travelerId ?? "unassigned"}`;
}

function asClothingSubcategory(value: string | null): ClothingSubcategory | null {
  if (!value) return null;
  return (CLOTHING_SUBCATEGORIES as readonly string[]).includes(value)
    ? (value as ClothingSubcategory)
    : null;
}

/**
 * Clothing checklist lines should be category buckets (Shirts, Swimsuits…),
 * with specific closet pieces nested underneath — never brand-level parents.
 *
 * Only gear that the AI named as a packing line is pre-selected as a child;
 * the rest stays available under "Which ones?".
 */
export function structurePackingWithCloset(
  items: PackingDraft[],
  gearItems: GearItem[]
): PackingDraftWithId[] {
  const result: PackingDraftWithId[] = [];
  const clothingParents = new Map<string, PackingDraftWithId>();
  const pendingGearChildren: {
    gear: GearItem;
    traveler_id: string | null;
    shared: boolean;
    activity_name: string | null;
    subcategory: ClothingSubcategory;
  }[] = [];
  let sortOrder = 0;

  const gearByName = new Map(
    gearItems.map((g) => [g.item_name.trim().toLowerCase(), g] as const)
  );

  const pushParent = (draft: PackingDraft): PackingDraftWithId => {
    const withId: PackingDraftWithId = { ...draft, id: newId(), sort_order: sortOrder++ };
    result.push(withId);
    return withId;
  };

  const ensureClothingParent = (
    subcategory: ClothingSubcategory,
    template: PackingDraft
  ): PackingDraftWithId => {
    const key = parentKey(
      "clothing",
      subcategory,
      template.traveler_id,
      template.shared
    );
    const existing = clothingParents.get(key);
    if (existing) {
      existing.quantity = Math.max(existing.quantity, template.quantity);
      if (!existing.activity_name && template.activity_name) {
        existing.activity_name = template.activity_name;
      }
      return existing;
    }

    const parent = pushParent({
      ...template,
      item_name: subcategoryLabel(subcategory),
      category: "clothing",
      parent_item_id: null,
      gear_item_id: null,
      quantity: Math.max(1, template.quantity),
    });
    clothingParents.set(key, parent);
    return parent;
  };

  for (const item of items) {
    if (item.parent_item_id) continue;

    if (item.category !== "clothing") {
      pushParent({ ...item, parent_item_id: null, gear_item_id: null });
      continue;
    }

    const matchedGear = gearByName.get(item.item_name.trim().toLowerCase());
    const sub = asClothingSubcategory(
      inferSubcategory(item.item_name, "clothing") ??
        (matchedGear
          ? inferSubcategory(matchedGear.item_name, matchedGear.category)
          : null) ??
        matchedGear?.subcategory ??
        null
    );

    if (!sub) {
      pushParent({ ...item, parent_item_id: null, gear_item_id: null });
      continue;
    }

    ensureClothingParent(sub, item);

    if (matchedGear && matchedGear.category === "clothing") {
      pendingGearChildren.push({
        gear: matchedGear,
        traveler_id: item.traveler_id,
        shared: item.shared,
        activity_name: item.activity_name,
        subcategory: sub,
      });
    }
  }

  const usedGear = new Set<string>();
  for (const pending of pendingGearChildren) {
    if (usedGear.has(pending.gear.id)) continue;

    const parent = ensureClothingParent(pending.subcategory, {
      item_name: subcategoryLabel(pending.subcategory),
      quantity: 1,
      category: "clothing",
      traveler_id: pending.traveler_id,
      parent_item_id: null,
      gear_item_id: null,
      packed: false,
      shared: pending.shared,
      activity_name: pending.activity_name,
      notes: null,
      sort_order: 0,
    });

    usedGear.add(pending.gear.id);
    result.push({
      id: newId(),
      item_name: pending.gear.item_name,
      quantity: 1,
      category: "clothing",
      traveler_id: parent.traveler_id,
      parent_item_id: parent.id,
      gear_item_id: pending.gear.id,
      packed: false,
      shared: parent.shared,
      activity_name: pending.activity_name,
      notes: null,
      sort_order: sortOrder++,
    });
  }

  return result;
}
