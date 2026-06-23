import type { PackingCategory } from "@/lib/types";

/** Placeholder when adding a packing-list line in a category section */
export const CATEGORY_LINE_PLACEHOLDERS: Record<PackingCategory, string> = {
  clothing: "e.g. 7 shirts, golf shorts...",
  shoes: "e.g. sneakers, golf shoes...",
  toiletries: "e.g. toothbrush, sunscreen...",
  electronics: "e.g. phone charger, headphones...",
  travel_documents: "e.g. passport, boarding passes...",
  medications: "e.g. allergy pills, vitamins...",
  activity_gear: "e.g. golf balls, tennis racket...",
  pet_supplies: "e.g. food bowl, leash...",
  miscellaneous: "e.g. umbrella, snack bag...",
};

/** Placeholder when adding a single item to a day outfit */
export const CATEGORY_ITEM_PLACEHOLDERS: Record<PackingCategory, string> = {
  clothing: "e.g. golf shirt, linen shorts...",
  shoes: "e.g. golf shoes, sandals...",
  toiletries: "e.g. toothbrush, travel shampoo...",
  electronics: "e.g. phone charger, earbuds...",
  travel_documents: "e.g. passport copy...",
  medications: "e.g. allergy pills...",
  activity_gear: "e.g. golf glove, water bottle...",
  pet_supplies: "e.g. travel bowl, leash...",
  miscellaneous: "e.g. umbrella, snack bag...",
};
