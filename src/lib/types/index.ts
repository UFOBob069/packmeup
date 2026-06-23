export type TravelType = "carry_on" | "checked_bag" | "multiple_bags" | "road_trip";
export type LaundryAccess = "none" | "limited" | "full";
export type StylePreference =
  | "casual"
  | "smart_casual"
  | "business"
  | "formal"
  | "athletic"
  | "minimalist";
export type PackingMode = "standard" | "minimalist" | "comfort" | "carry_on_optimized";
export type TravelerType = "adult" | "child" | "infant" | "pet";
export type MemberRole = "owner" | "editor" | "viewer";
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

export const ACTIVITY_OPTIONS = [
  "Golf",
  "Hiking",
  "Beach",
  "Pool",
  "Business Meetings",
  "Wedding",
  "Theme Parks",
  "Running",
  "Gym",
  "Skiing",
  "Nice Dinners",
  "Sightseeing",
] as const;

export type ActivityName = (typeof ACTIVITY_OPTIONS)[number];

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  owner_id: string;
  destination: string;
  start_date: string;
  end_date: string;
  travel_type: TravelType;
  laundry_access: LaundryAccess;
  style_preference: StylePreference;
  style_preferences?: StylePreference[];
  packing_mode: PackingMode;
  special_notes: string | null;
  weather_data: WeatherData | null;
  cover_image_url?: string | null;
  share_token: string;
  created_at: string;
  updated_at: string;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  profile?: Profile;
}

export type PetSpecies = "dog" | "cat" | "other";
export type PetSize = "small" | "medium" | "large";

export interface Traveler {
  id: string;
  trip_id: string;
  name: string;
  traveler_type: TravelerType;
  pet_species: PetSpecies | null;
  pet_size: PetSize | null;
  sort_order: number;
  created_at: string;
}

export interface OnboardingTraveler {
  name: string;
  traveler_type: TravelerType;
  pet_species?: PetSpecies;
  pet_size?: PetSize;
}

export interface Activity {
  id: string;
  trip_id: string;
  activity_name: string;
  created_at: string;
}

export interface PackingItem {
  id: string;
  trip_id: string;
  traveler_id: string | null;
  parent_item_id: string | null;
  gear_item_id: string | null;
  category: PackingCategory;
  item_name: string;
  quantity: number;
  packed: boolean;
  shared: boolean;
  activity_name: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  traveler?: Traveler;
}

export interface OutfitItem {
  name: string;
  gear_item_id?: string | null;
  category?: PackingCategory | null;
  /** True when added as "this day only" — not synced to checklist */
  day_only?: boolean;
}

export interface Outfit {
  id: string;
  trip_id: string;
  trip_date: string;
  time_of_day: "morning" | "afternoon" | "evening" | "all_day";
  title: string;
  description: string;
  activity_name: string | null;
  items: OutfitItem[];
  created_at: string;
}

export interface CalendarDay {
  id: string;
  trip_id: string;
  trip_date: string;
  title: string;
  activities: string[];
  weather_summary: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  template_data: TripTemplateData;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  trip_id: string;
  user_id: string | null;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface GearItem {
  id: string;
  user_id: string;
  item_name: string;
  category: PackingCategory;
  description: string | null;
  color: string | null;
  subcategory: string | null;
  created_at: string;
  updated_at: string;
}

export interface WeatherData {
  location: string;
  daily: WeatherDay[];
  fetched_at: string;
}

export interface WeatherDay {
  date: string;
  temp_high: number;
  temp_low: number;
  conditions: string;
  rain_chance: number;
  wind_mph: number;
}

export interface TripOnboardingData {
  destination: string;
  is_multi_destination?: boolean;
  additional_destinations?: string;
  destination_context?: string;
  start_date: string;
  end_date: string;
  travelers: OnboardingTraveler[];
  travel_type: TravelType;
  laundry_access: LaundryAccess;
  style_preference: StylePreference;
  style_preferences: StylePreference[];
  packing_mode: PackingMode;
  activities: string[];
  special_notes: string;
}

export interface TripTemplateData {
  travel_type?: TravelType;
  laundry_access?: LaundryAccess;
  style_preference?: StylePreference;
  packing_mode?: PackingMode;
  activities?: string[];
  special_notes?: string;
  travelers?: { name: string; traveler_type: TravelerType }[];
}

export interface TripWithDetails extends Trip {
  travelers: Traveler[];
  activities: Activity[];
  packing_items: PackingItem[];
  outfits: Outfit[];
  calendar_days: CalendarDay[];
  members: TripMember[];
}

export interface PackingProgress {
  total: number;
  packed: number;
  percentage: number;
  byTraveler: Record<string, { name: string; packed: number; total: number }>;
}

export const CATEGORY_LABELS: Record<PackingCategory, string> = {
  clothing: "Clothing",
  shoes: "Shoes",
  toiletries: "Toiletries",
  electronics: "Electronics",
  travel_documents: "Travel Documents",
  medications: "Medications",
  activity_gear: "Activity Gear",
  pet_supplies: "Pet Supplies",
  miscellaneous: "Miscellaneous",
};

export const TRAVEL_TYPE_LABELS: Record<TravelType, string> = {
  carry_on: "Carry-On Only",
  checked_bag: "Checked Bag",
  multiple_bags: "Multiple Bags",
  road_trip: "Road Trip",
};

export const STYLE_LABELS: Record<StylePreference, string> = {
  casual: "Casual",
  smart_casual: "Smart Casual",
  business: "Business",
  formal: "Formal",
  athletic: "Athletic",
  minimalist: "Minimalist",
};

export const PACKING_MODE_LABELS: Record<PackingMode, string> = {
  standard: "Standard",
  minimalist: "Minimalist",
  comfort: "Comfort",
  carry_on_optimized: "Carry-On Optimized",
};
