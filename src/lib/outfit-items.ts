import type { OutfitItem, PackingCategory } from "@/lib/types";

export function normalizeOutfitItem(raw: unknown): OutfitItem {
  if (typeof raw === "string") {
    return { name: raw };
  }
  if (raw && typeof raw === "object" && "name" in raw) {
    const obj = raw as OutfitItem;
    return {
      name: String(obj.name ?? "").trim(),
      gear_item_id: obj.gear_item_id ?? null,
      category: obj.category ?? null,
      day_only: obj.day_only ?? false,
    };
  }
  return { name: String(raw ?? "") };
}

export function normalizeOutfitItems(items: unknown): OutfitItem[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeOutfitItem).filter((i) => i.name.length > 0);
}

export function outfitItemName(item: OutfitItem): string {
  return item.name;
}

export function serializeOutfitItems(items: OutfitItem[]): OutfitItem[] {
  return items.map((item) => {
    const entry: OutfitItem = { name: item.name.trim() };
    if (item.gear_item_id) entry.gear_item_id = item.gear_item_id;
    if (item.category) entry.category = item.category;
    if (item.day_only) entry.day_only = true;
    return entry;
  });
}

export function outfitItemKey(item: OutfitItem): string {
  return item.gear_item_id ?? item.name.toLowerCase();
}

export function isSyncedOutfitItem(item: OutfitItem): boolean {
  return Boolean(item.gear_item_id) && !item.day_only;
}

export function categoryForOutfitItem(
  item: OutfitItem,
  fallback: PackingCategory = "miscellaneous"
): PackingCategory {
  return item.category ?? fallback;
}
