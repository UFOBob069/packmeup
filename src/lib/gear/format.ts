import type { GearItem } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";

export function formatGearForAiPrompt(gearItems: GearItem[]): string {
  if (!gearItems.length) return "None";

  const byCategory = gearItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, GearItem[]>
  );

  return Object.entries(byCategory)
    .map(([category, items]) => {
      const label = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;
      const names = items.map((i) => i.item_name).join(", ");
      return `${label}: ${names}`;
    })
    .join("\n");
}

export function buildGearDisplayName(item: Pick<GearItem, "item_name" | "description">): string {
  if (!item.description?.trim()) return item.item_name;
  return item.item_name;
}
