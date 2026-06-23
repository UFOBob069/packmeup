import type {
  GearItem,
  PackingCategory,
  PackingItem,
  TripWithDetails,
} from "@/lib/types";
import { normalizeOutfitItems, isSyncedOutfitItem } from "@/lib/outfit-items";
import { packingItemHasGear } from "@/lib/packing/sync-gear-to-checklist";

export interface PackingGapFix {
  type: "add_gear" | "add_generic";
  item_name: string;
  category: PackingCategory;
  gear_item_id?: string;
  activity_name?: string | null;
}

export interface PackingGap {
  id: string;
  severity: "warning" | "info";
  message: string;
  fix?: PackingGapFix;
}

const ACTIVITY_KEYWORDS: Record<string, RegExp[]> = {
  golf: [/\bgolf\b/i, /\bpolos?\b/i, /\bspikes?\b/i],
  pool: [/\bswim/i, /\bbikini\b/i, /\btrunks?\b/i],
  beach: [/\bswim/i, /\bsunscreen\b/i, /\bflip.?flops?\b/i],
  hiking: [/\bhiking\b/i, /\bboots?\b/i, /\btrail\b/i],
  dinner: [/\bnice\b/i, /\bdress\b/i, /\bheels?\b/i],
};

function childrenOf(packingItems: PackingItem[], parentId: string): PackingItem[] {
  return packingItems.filter((i) => i.parent_item_id === parentId);
}

function checklistMentionsKeyword(
  packingItems: PackingItem[],
  patterns: RegExp[]
): boolean {
  return packingItems.some((i) => patterns.some((p) => p.test(i.item_name)));
}

export function analyzePackingGaps(
  trip: Pick<
    TripWithDetails,
    "packing_items" | "outfits" | "calendar_days" | "activities" | "travelers"
  >,
  gearItems: GearItem[] = []
): PackingGap[] {
  const gaps: PackingGap[] = [];
  const { packing_items: packingItems, outfits, calendar_days: calendarDays } = trip;
  const gearById = Object.fromEntries(gearItems.map((g) => [g.id, g]));

  for (const parent of packingItems.filter((i) => !i.parent_item_id)) {
    const kids = childrenOf(packingItems, parent.id);
    if (parent.quantity > 1 && kids.length < parent.quantity) {
      gaps.push({
        id: `parent-incomplete-${parent.id}`,
        severity: "warning",
        message: `"${parent.item_name}" needs ${parent.quantity} specific items — only ${kids.length} picked.`,
      });
    }
    if (parent.quantity > 1 && kids.length === 0) {
      gaps.push({
        id: `parent-empty-${parent.id}`,
        severity: "info",
        message: `Pick which items for "${parent.item_name}" from My Gear under your checklist.`,
      });
    }
  }

  for (const outfit of outfits) {
    const items = normalizeOutfitItems(outfit.items);
    if (items.length === 0) {
      gaps.push({
        id: `outfit-empty-${outfit.id}`,
        severity: "info",
        message: `"${outfit.title}" on ${outfit.trip_date} has no items picked yet.`,
      });
    }

    for (const item of items) {
      if (!isSyncedOutfitItem(item) || !item.gear_item_id) continue;

      if (packingItemHasGear(packingItems, item.gear_item_id)) continue;

      const gear = gearById[item.gear_item_id];
      const name = gear?.item_name ?? item.name;
      const category = gear?.category ?? item.category ?? "miscellaneous";

      gaps.push({
        id: `outfit-gear-${outfit.id}-${item.gear_item_id}`,
        severity: "warning",
        message: `"${name}" is on ${outfit.title} (${outfit.trip_date}) but not on your packing list.`,
        fix: {
          type: "add_gear",
          item_name: name,
          category,
          gear_item_id: item.gear_item_id,
          activity_name: outfit.activity_name,
        },
      });
    }
  }

  const activityNames = new Set<string>();
  trip.activities.forEach((a) => activityNames.add(a.activity_name.toLowerCase()));
  outfits.forEach((o) => {
    if (o.activity_name) activityNames.add(o.activity_name.toLowerCase());
  });
  calendarDays.forEach((d) => {
    (d.activities as string[]).forEach((a) => activityNames.add(a.toLowerCase()));
  });

  for (const activity of activityNames) {
    const patterns = ACTIVITY_KEYWORDS[activity];
    if (!patterns) continue;
    if (!checklistMentionsKeyword(packingItems, patterns)) {
      const label = activity.charAt(0).toUpperCase() + activity.slice(1);
      gaps.push({
        id: `activity-${activity}`,
        severity: "info",
        message: `You have ${label} planned — double-check related gear is on your list.`,
      });
    }
  }

  const unpackedShared = packingItems.filter((i) => i.shared && !i.packed);
  if (unpackedShared.length > 0) {
    gaps.push({
      id: "shared-unpacked",
      severity: "info",
      message: `${unpackedShared.length} shared item${unpackedShared.length === 1 ? "" : "s"} still not packed.`,
    });
  }

  return gaps;
}

export function formatGapsForAi(gaps: PackingGap[]): string {
  if (gaps.length === 0) return "No packing gaps detected.";
  return gaps.map((g) => `- [${g.severity}] ${g.message}`).join("\n");
}
