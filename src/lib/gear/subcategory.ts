import type { PackingCategory } from "@/lib/types";

export const CLOTHING_SUBCATEGORIES = [
  "shirts",
  "shorts",
  "swimsuits",
  "pants",
  "dresses",
  "jackets",
  "underwear",
  "socks",
  "hats",
] as const;

export type ClothingSubcategory = (typeof CLOTHING_SUBCATEGORIES)[number];

export const SUBCATEGORY_LABELS: Record<ClothingSubcategory, string> = {
  shirts: "Shirts & tops",
  shorts: "Shorts",
  swimsuits: "Swimsuits",
  pants: "Pants & chinos",
  dresses: "Dresses",
  jackets: "Jackets & layers",
  underwear: "Underwear",
  socks: "Socks",
  hats: "Hats",
};

const INFER_RULES: { subcategory: ClothingSubcategory; patterns: RegExp[] }[] = [
  {
    subcategory: "swimsuits",
    patterns: [
      /\bswimsuits?\b/,
      /\bbikinis?\b/,
      /\bswim\s*trunks?\b/,
      /\btrunks\b/,
      /\bboard\s*shorts?\b/,
    ],
  },
  {
    subcategory: "shorts",
    patterns: [/\bshorts\b/],
  },
  {
    subcategory: "shirts",
    patterns: [
      /\b(polos?|shirts?|tees?|t-?shirts?|blouses?|tops?|henleys?)\b/,
      /\bv-?necks?\b/,
    ],
  },
  {
    subcategory: "pants",
    patterns: [/\b(pants?|chinos?|jeans?|trousers?|slacks?|leggings?)\b/],
  },
  {
    subcategory: "dresses",
    patterns: [/\b(dresses?|gowns?|skirts?)\b/],
  },
  {
    subcategory: "jackets",
    patterns: [/\b(jackets?|coats?|hoodies?|sweaters?|fleeces?|cardigans?)\b/],
  },
  {
    subcategory: "underwear",
    patterns: [/\b(underwear|underpants|briefs|boxers|bras?|panties)\b/],
  },
  {
    subcategory: "socks",
    patterns: [/\bsocks?\b/],
  },
  {
    subcategory: "hats",
    patterns: [/\b(hats?|caps?|visors?|beanies?)\b/],
  },
];

export function inferSubcategory(
  name: string,
  category: PackingCategory
): string | null {
  if (category !== "clothing") return null;

  const lower = name.toLowerCase();
  for (const rule of INFER_RULES) {
    if (rule.patterns.some((p) => p.test(lower))) {
      return rule.subcategory;
    }
  }
  return null;
}

export function resolveGearSubcategory(
  gear: { item_name: string; category: PackingCategory; subcategory?: string | null }
): string | null {
  if (gear.category !== "clothing") return null;
  return gear.subcategory ?? inferSubcategory(gear.item_name, gear.category);
}

export function gearMatchesParentLine(
  gear: { item_name: string; category: PackingCategory; subcategory?: string | null },
  parentItemName: string,
  parentCategory: PackingCategory
): boolean {
  if (gear.category !== parentCategory) return false;
  if (parentCategory !== "clothing") {
    // Non-clothing: only suggest closet items that clearly match the parent line.
    const parent = parentItemName.toLowerCase();
    const name = gear.item_name.toLowerCase();
    return parent.includes(name) || name.includes(parent) || parent.split(/\s+/).some((w) => w.length > 3 && name.includes(w));
  }

  const parentSub = inferSubcategory(parentItemName, parentCategory);
  if (!parentSub) return false;

  const gearSub = resolveGearSubcategory(gear);
  return gearSub === parentSub;
}

export function subcategoryLabel(subcategory: string | null): string {
  if (!subcategory) return "items";
  return (
    SUBCATEGORY_LABELS[subcategory as ClothingSubcategory] ??
    subcategory.replace(/_/g, " ")
  );
}
