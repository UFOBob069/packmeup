export type TravelerType = "adult" | "child" | "infant" | "pet";
export type PackingCategory =
  | "clothing"
  | "shoes"
  | "toiletries"
  | "electronics"
  | "travel_documents"
  | "medications"
  | "activity_gear"
  | "pet_supplies"
  | "miscellaneous";

export interface Trip {
  id: string;
  owner_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  cover_image_url: string | null;
  travel_type: string;
}

export interface Traveler {
  id: string;
  trip_id: string;
  name: string;
  traveler_type: TravelerType;
  sort_order: number;
}

export interface PackingItem {
  id: string;
  trip_id: string;
  traveler_id: string | null;
  parent_item_id: string | null;
  category: PackingCategory;
  item_name: string;
  quantity: number;
  packed: boolean;
  shared: boolean;
  sort_order: number;
}

export interface GearItem {
  id: string;
  user_id: string;
  item_name: string;
  category: PackingCategory;
  description: string | null;
}

export interface GroupMember {
  id: string;
  user_id: string;
  name: string;
  traveler_type: TravelerType;
  pet_species: "dog" | "cat" | "other" | null;
  pet_size: "small" | "medium" | "large" | null;
}

export const CATEGORY_LABELS: Record<PackingCategory, string> = {
  clothing: "Clothing",
  shoes: "Shoes",
  toiletries: "Toiletries",
  electronics: "Electronics",
  travel_documents: "Documents",
  medications: "Medications",
  activity_gear: "Activity gear",
  pet_supplies: "Pet supplies",
  miscellaneous: "Miscellaneous",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as PackingCategory[];
