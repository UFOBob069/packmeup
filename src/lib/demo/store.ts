import type {
  Activity,
  CalendarDay,
  ChatMessage,
  GearItem,
  GroupMember,
  Outfit,
  PackingItem,
  PackingProgress,
  Profile,
  Template,
  Traveler,
  Trip,
  TripMember,
  TripOnboardingData,
  TripWithDetails,
  TripWorkspaceItem,
  WeatherData,
} from "@/lib/types";
import { DEMO_USER } from "@/lib/constants";
import { generateTripContent } from "@/lib/ai/packing-generator";
import { buildTripSpecialNotes } from "@/lib/trip-notes";
import { fetchWeather, buildFallbackWeather } from "@/lib/weather/weather-service";
import { fetchDestinationCoverUrl } from "@/lib/unsplash/destination-cover";

const DEMO_COVER_FALLBACK =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80";

function uuid(): string {
  return crypto.randomUUID();
}

interface DemoStore {
  profiles: Map<string, Profile>;
  trips: Map<string, Trip>;
  travelers: Map<string, Traveler>;
  activities: Map<string, Activity>;
  packing_items: Map<string, PackingItem>;
  outfits: Map<string, Outfit>;
  calendar_days: Map<string, CalendarDay>;
  trip_members: Map<string, TripMember>;
  templates: Map<string, Template>;
  chat_messages: Map<string, ChatMessage>;
  gear_items: Map<string, GearItem>;
  group_members: Map<string, GroupMember>;
  workspace_items: Map<string, TripWorkspaceItem>;
  currentUserId: string;
}

const globalForDemo = globalThis as unknown as { demoStore?: DemoStore };

function seedDemoGearItems(store: DemoStore) {
  if (store.gear_items.size > 0) return;

  const now = new Date().toISOString();
  const sampleGear: Omit<GearItem, "created_at" | "updated_at">[] = [
    { id: "gear-1", user_id: DEMO_USER.id, item_name: "Blue Nike Polo", category: "clothing", description: null, color: "blue", subcategory: "shirts" },
    { id: "gear-2", user_id: DEMO_USER.id, item_name: "Pink TravisMathew Polo", category: "clothing", description: null, color: "pink", subcategory: "shirts" },
    { id: "gear-3", user_id: DEMO_USER.id, item_name: "White Golf Shoes", category: "shoes", description: null, color: "white", subcategory: null },
    { id: "gear-4", user_id: DEMO_USER.id, item_name: "Anker Charger", category: "electronics", description: "65W USB-C", color: null, subcategory: null },
    { id: "gear-5", user_id: DEMO_USER.id, item_name: "Andre's Travel Bowl", category: "pet_supplies", description: null, color: null, subcategory: null },
    { id: "gear-6", user_id: DEMO_USER.id, item_name: "Passport Holder", category: "travel_documents", description: null, color: null, subcategory: null },
  ];

  sampleGear.forEach((item) => {
    store.gear_items.set(item.id, { ...item, created_at: now, updated_at: now });
  });
}

function seedDemoGroupMembers(store: DemoStore) {
  if (store.group_members.size > 0) return;

  const now = new Date().toISOString();
  const sample: Omit<GroupMember, "created_at" | "updated_at">[] = [
    { id: "group-1", user_id: DEMO_USER.id, name: "David", traveler_type: "adult", pet_species: null, pet_size: null },
    { id: "group-2", user_id: DEMO_USER.id, name: "Jen", traveler_type: "adult", pet_species: null, pet_size: null },
    { id: "group-3", user_id: DEMO_USER.id, name: "Andre", traveler_type: "pet", pet_species: "dog", pet_size: "medium" },
  ];

  sample.forEach((member) => {
    store.group_members.set(member.id, { ...member, created_at: now, updated_at: now });
  });
}

/** Backfill collections added after an in-memory demo store was first created (e.g. dev HMR). */
function ensureDemoStoreShape(store: DemoStore) {
  if (!store.gear_items) {
    store.gear_items = new Map();
    seedDemoGearItems(store);
  }
  if (!store.group_members) {
    store.group_members = new Map();
    seedDemoGroupMembers(store);
  }
  if (!store.workspace_items) {
    store.workspace_items = new Map();
  }
}

function getStore(): DemoStore {
  if (!globalForDemo.demoStore) {
    globalForDemo.demoStore = {
      profiles: new Map(),
      trips: new Map(),
      travelers: new Map(),
      activities: new Map(),
      packing_items: new Map(),
      outfits: new Map(),
      calendar_days: new Map(),
      trip_members: new Map(),
      templates: new Map(),
      chat_messages: new Map(),
      gear_items: new Map(),
      group_members: new Map(),
      workspace_items: new Map(),
      currentUserId: DEMO_USER.id,
    };
    seedDemoData(globalForDemo.demoStore);
  } else {
    ensureDemoStoreShape(globalForDemo.demoStore);
  }
  return globalForDemo.demoStore;
}

function seedDemoData(store: DemoStore) {
  const now = new Date().toISOString();
  store.profiles.set(DEMO_USER.id, {
    id: DEMO_USER.id,
    email: DEMO_USER.email,
    name: DEMO_USER.name,
    avatar_url: null,
    created_at: now,
    updated_at: now,
  });

  const tripId = "demo-trip-scottsdale";
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 14);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 4);

  const trip: Trip = {
    id: tripId,
    owner_id: DEMO_USER.id,
    destination: "Scottsdale, Arizona",
    start_date: startDate.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
    travel_type: "checked_bag",
    laundry_access: "limited",
    style_preference: "smart_casual",
    style_preferences: ["smart_casual", "athletic"],
    packing_mode: "standard",
    special_notes: "Golf weekend with Jen. Andre (dog) is coming too.",
    weather_data: buildFallbackWeather(
      "Scottsdale, Arizona",
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0]
    ),
    cover_image_url: DEMO_COVER_FALLBACK,
    share_token: "demo-share-token",
    created_at: now,
    updated_at: now,
  };
  store.trips.set(tripId, trip);

  const travelers = [
    { id: "t-david", name: "David", type: "adult" as const },
    { id: "t-jen", name: "Jen", type: "adult" as const },
    { id: "t-andre", name: "Andre", type: "pet" as const },
  ];

  travelers.forEach((t, i) => {
    store.travelers.set(t.id, {
      id: t.id,
      trip_id: tripId,
      name: t.name,
      traveler_type: t.type,
      pet_species: t.type === "pet" ? "dog" : null,
      pet_size: t.type === "pet" ? "medium" : null,
      sort_order: i,
      created_at: now,
    });
  });

  ["Golf", "Pool", "Nice Dinners"].forEach((name, i) => {
    const id = `act-${i}`;
    store.activities.set(id, {
      id,
      trip_id: tripId,
      activity_name: name,
      created_at: now,
    });
  });

  const sampleItems: Omit<PackingItem, "created_at" | "updated_at">[] = [
    { id: "pi-1", trip_id: tripId, traveler_id: "t-david", parent_item_id: null, gear_item_id: null, user_id: DEMO_USER.id, category: "clothing", item_name: "Golf polos", quantity: 2, packed: true, shared: false, activity_name: "Golf", notes: null, sort_order: 0 },
    { id: "pi-1a", trip_id: tripId, traveler_id: "t-david", parent_item_id: "pi-1", gear_item_id: "gear-1", user_id: DEMO_USER.id, category: "clothing", item_name: "Blue Nike Polo", quantity: 1, packed: true, shared: false, activity_name: "Golf", notes: null, sort_order: 0 },
    { id: "pi-2", trip_id: tripId, traveler_id: "t-david", parent_item_id: null, gear_item_id: null, user_id: DEMO_USER.id, category: "shoes", item_name: "Golf Shoes", quantity: 1, packed: false, shared: false, activity_name: "Golf", notes: null, sort_order: 1 },
    { id: "pi-3", trip_id: tripId, traveler_id: "t-jen", parent_item_id: null, gear_item_id: null, user_id: DEMO_USER.id, category: "clothing", item_name: "Swimsuit", quantity: 1, packed: true, shared: false, activity_name: "Pool", notes: null, sort_order: 2 },
    { id: "pi-4", trip_id: tripId, traveler_id: null, parent_item_id: null, gear_item_id: null, user_id: DEMO_USER.id, category: "toiletries", item_name: "Sunscreen SPF 50", quantity: 1, packed: false, shared: true, activity_name: null, notes: null, sort_order: 3 },
    { id: "pi-5", trip_id: tripId, traveler_id: "t-andre", parent_item_id: null, gear_item_id: null, user_id: DEMO_USER.id, category: "pet_supplies", item_name: "Dog Leash", quantity: 1, packed: true, shared: false, activity_name: null, notes: null, sort_order: 4 },
    { id: "pi-6", trip_id: tripId, traveler_id: "t-andre", parent_item_id: null, gear_item_id: null, user_id: DEMO_USER.id, category: "pet_supplies", item_name: "Dog Food", quantity: 5, packed: false, shared: false, activity_name: null, notes: null, sort_order: 5 },
    { id: "pi-7", trip_id: tripId, traveler_id: "t-david", parent_item_id: null, gear_item_id: null, user_id: DEMO_USER.id, category: "clothing", item_name: "Chinos", quantity: 2, packed: false, shared: false, activity_name: null, notes: null, sort_order: 6 },
    { id: "pi-8", trip_id: tripId, traveler_id: null, parent_item_id: null, gear_item_id: null, user_id: DEMO_USER.id, category: "electronics", item_name: "Portable Phone Charger", quantity: 1, packed: true, shared: true, activity_name: null, notes: null, sort_order: 7 },
  ];

  sampleItems.forEach((item) => {
    store.packing_items.set(item.id, {
      ...item,
      created_at: now,
      updated_at: now,
    });
  });

  store.templates.set("tpl-golf", {
    id: "tpl-golf",
    user_id: DEMO_USER.id,
    name: "Golf Weekend",
    description: "Perfect for a 3-4 day golf getaway",
    template_data: {
      activities: ["Golf", "Nice Dinners", "Pool"],
      style_preference: "smart_casual",
      travel_type: "checked_bag",
      packing_mode: "standard",
    },
    created_at: now,
    updated_at: now,
  });

  store.templates.set("tpl-beach", {
    id: "tpl-beach",
    user_id: DEMO_USER.id,
    name: "Family Beach Vacation",
    description: "Sun, sand, and family fun",
    template_data: {
      activities: ["Beach", "Pool", "Sightseeing"],
      style_preference: "casual",
      travel_type: "multiple_bags",
    },
    created_at: now,
    updated_at: now,
  });

  seedDemoGearItems(store);
  seedDemoGroupMembers(store);
}

export function getDemoUser(): Profile {
  return getStore().profiles.get(DEMO_USER.id)!;
}

export function getDemoTrips(userId: string): Trip[] {
  const store = getStore();
  return Array.from(store.trips.values()).filter(
    (t) =>
      t.owner_id === userId ||
      Array.from(store.trip_members.values()).some(
        (m) => m.trip_id === t.id && m.user_id === userId
      )
  );
}

export function getDemoTripWithDetails(
  tripId: string,
  viewerUserId: string = DEMO_USER.id
): TripWithDetails | null {
  const store = getStore();
  const trip = store.trips.get(tripId);
  if (!trip) return null;

  return {
    ...trip,
    travelers: Array.from(store.travelers.values())
      .filter((t) => t.trip_id === tripId)
      .sort((a, b) => a.sort_order - b.sort_order),
    activities: Array.from(store.activities.values()).filter((a) => a.trip_id === tripId),
    packing_items: Array.from(store.packing_items.values())
      .filter(
        (p) =>
          p.trip_id === tripId &&
          (p.shared || p.user_id === viewerUserId || p.user_id == null)
      )
      .sort((a, b) => a.sort_order - b.sort_order),
    outfits: Array.from(store.outfits.values()).filter(
      (o) =>
        o.trip_id === tripId && (o.user_id === viewerUserId || o.user_id == null)
    ),
    calendar_days: Array.from(store.calendar_days.values()).filter((c) => c.trip_id === tripId),
    workspace_items: Array.from(store.workspace_items.values())
      .filter((item) => item.trip_id === tripId)
      .sort((a, b) => a.sort_order - b.sort_order),
    members: Array.from(store.trip_members.values()).filter((m) => m.trip_id === tripId),
  };
}

export function updateDemoTripCover(tripId: string, coverImageUrl: string): void {
  const store = getStore();
  const trip = store.trips.get(tripId);
  if (!trip) return;
  store.trips.set(tripId, { ...trip, cover_image_url: coverImageUrl, updated_at: new Date().toISOString() });
}

export function updateDemoTripWeather(tripId: string, weather: WeatherData): void {
  const store = getStore();
  const trip = store.trips.get(tripId);
  if (!trip) return;
  store.trips.set(tripId, { ...trip, weather_data: weather, updated_at: new Date().toISOString() });
}

export async function createDemoTrip(
  userId: string,
  data: TripOnboardingData
): Promise<TripWithDetails> {
  const store = getStore();
  const now = new Date().toISOString();
  const tripId = uuid();

  const [weather, coverImageUrl] = await Promise.all([
    fetchWeather(data.destination, data.start_date, data.end_date),
    fetchDestinationCoverUrl(data.destination),
  ]);

  const trip: Trip = {
    id: tripId,
    owner_id: userId,
    destination: data.destination,
    start_date: data.start_date,
    end_date: data.end_date,
    travel_type: data.travel_type,
    laundry_access: data.laundry_access,
    style_preference: data.style_preference,
    style_preferences: data.style_preferences?.length
      ? data.style_preferences
      : [data.style_preference],
    packing_mode: data.packing_mode,
    special_notes: buildTripSpecialNotes(data) || null,
    weather_data: weather,
    cover_image_url: coverImageUrl ?? DEMO_COVER_FALLBACK,
    share_token: uuid().replace(/-/g, "").slice(0, 32),
    created_at: now,
    updated_at: now,
  };
  store.trips.set(tripId, trip);

  const travelerIds: { name: string; id: string }[] = [];
  data.travelers.forEach((t, i) => {
    const id = uuid();
    travelerIds.push({ name: t.name, id });
    store.travelers.set(id, {
      id,
      trip_id: tripId,
      name: t.name,
      traveler_type: t.traveler_type,
      pet_species: t.traveler_type === "pet" ? (t.pet_species ?? "dog") : null,
      pet_size: t.traveler_type === "pet" ? (t.pet_size ?? "medium") : null,
      sort_order: i,
      created_at: now,
    });
  });

  data.travelers.forEach((t) => {
    addDemoGroupMember(userId, {
      name: t.name,
      traveler_type: t.traveler_type,
      pet_species: t.traveler_type === "pet" ? (t.pet_species ?? "dog") : null,
      pet_size: t.traveler_type === "pet" ? (t.pet_size ?? "medium") : null,
    });
  });

  data.activities.forEach((name) => {
    const id = uuid();
    store.activities.set(id, { id, trip_id: tripId, activity_name: name, created_at: now });
  });

  const generated = await generateTripContent(
    data,
    weather,
    travelerIds,
    getDemoGearItems(userId)
  );

  generated.packing_items.forEach((item) => {
    const id = item.id ?? uuid();
    store.packing_items.set(id, {
      ...item,
      id,
      user_id: item.user_id ?? userId,
      trip_id: tripId,
      created_at: now,
      updated_at: now,
    });
  });

  generated.outfits.forEach((outfit) => {
    const id = uuid();
    store.outfits.set(id, {
      ...outfit,
      id,
      user_id: userId,
      trip_id: tripId,
      created_at: now,
    });
  });

  generated.calendar_days.forEach((day) => {
    const id = uuid();
    store.calendar_days.set(id, { ...day, id, trip_id: tripId, created_at: now });
  });

  if (trip.special_notes) {
    addDemoWorkspaceItem(tripId, "arrival", "Trip and arrival notes", trip.special_notes);
  }

  return getDemoTripWithDetails(tripId, userId)!;
}

export function toggleDemoItemPacked(itemId: string, packed: boolean): PackingItem | null {
  const store = getStore();
  const item = store.packing_items.get(itemId);
  if (!item) return null;
  const updated = { ...item, packed, updated_at: new Date().toISOString() };
  store.packing_items.set(itemId, updated);
  return updated;
}

export function updateDemoItemNotes(itemId: string, notes: string): PackingItem | null {
  const store = getStore();
  const item = store.packing_items.get(itemId);
  if (!item) return null;
  const updated = { ...item, notes, updated_at: new Date().toISOString() };
  store.packing_items.set(itemId, updated);
  return updated;
}

export function updateDemoCalendarDayNotes(dayId: string, notes: string): void {
  const store = getStore();
  const day = store.calendar_days.get(dayId);
  if (!day) return;
  store.calendar_days.set(dayId, { ...day, notes: notes.trim() || null });
}

export function upsertDemoCalendarDay(
  tripId: string,
  tripDate: string,
  updates: { title?: string; notes?: string; activities?: string[] }
): CalendarDay {
  const store = getStore();
  const existing = Array.from(store.calendar_days.values()).find(
    (d) => d.trip_id === tripId && d.trip_date === tripDate
  );
  const now = new Date().toISOString();

  if (existing) {
    const day: CalendarDay = {
      ...existing,
      title: updates.title ?? existing.title,
      notes:
        updates.notes !== undefined ? updates.notes.trim() || null : (existing.notes ?? null),
      activities:
        updates.activities !== undefined ? updates.activities : (existing.activities as string[]),
    };
    store.calendar_days.set(existing.id, day);
    return day;
  }

  const id = uuid();
  const day: CalendarDay = {
    id,
    trip_id: tripId,
    trip_date: tripDate,
    title: updates.title ?? "On the trip",
    activities: updates.activities ?? [],
    weather_summary: null,
    notes: updates.notes?.trim() || null,
    created_at: now,
  };
  store.calendar_days.set(id, day);
  return day;
}

export function updateDemoCalendarDayActivities(
  dayId: string,
  activities: string[]
): CalendarDay | null {
  const store = getStore();
  const day = store.calendar_days.get(dayId);
  if (!day) return null;
  const updated = { ...day, activities };
  store.calendar_days.set(dayId, updated);
  return updated;
}

export function updateDemoCalendarDayTitle(dayId: string, title: string): CalendarDay | null {
  const store = getStore();
  const day = store.calendar_days.get(dayId);
  if (!day) return null;
  const updated = { ...day, title: title.trim() || day.title };
  store.calendar_days.set(dayId, updated);
  return updated;
}

export function createDemoOutfit(
  tripId: string,
  input: {
    trip_date: string;
    time_of_day?: Outfit["time_of_day"];
    title?: string;
    description?: string;
    activity_name?: string | null;
    items?: (string | import("@/lib/types").OutfitItem)[];
    user_id?: string | null;
  }
): Outfit {
  const store = getStore();
  const now = new Date().toISOString();
  const id = uuid();
  const items = (input.items ?? []).map((item) =>
    typeof item === "string" ? { name: item } : item
  );
  const outfit: Outfit = {
    id,
    trip_id: tripId,
    user_id: input.user_id ?? DEMO_USER.id,
    trip_date: input.trip_date,
    time_of_day: input.time_of_day ?? "all_day",
    title: input.title?.trim() || "New event",
    description: input.description?.trim() || "",
    activity_name: input.activity_name ?? null,
    items,
    created_at: now,
  };
  store.outfits.set(id, outfit);
  return outfit;
}

export function updateDemoOutfit(
  outfitId: string,
  updates: Partial<
    Pick<Outfit, "title" | "description" | "time_of_day" | "activity_name" | "items" | "trip_date">
  >
): Outfit | null {
  const store = getStore();
  const outfit = store.outfits.get(outfitId);
  if (!outfit) return null;
  const updated: Outfit = {
    ...outfit,
    ...updates,
    title: updates.title !== undefined ? updates.title.trim() || outfit.title : outfit.title,
    description:
      updates.description !== undefined ? updates.description.trim() : outfit.description,
    items: updates.items !== undefined ? updates.items : outfit.items,
  };
  store.outfits.set(outfitId, updated);
  return updated;
}

export function deleteDemoOutfit(outfitId: string): void {
  getStore().outfits.delete(outfitId);
}

export function addDemoPackingItem(
  tripId: string,
  itemName: string,
  travelerId: string | null,
  options?: {
    quantity?: number;
    category?: PackingItem["category"];
    parent_item_id?: string | null;
    gear_item_id?: string | null;
    shared?: boolean;
    activity_name?: string | null;
    user_id?: string | null;
  }
): PackingItem {
  const store = getStore();
  const now = new Date().toISOString();
  const id = uuid();
  const sortOrder = Array.from(store.packing_items.values()).filter(
    (i) => i.trip_id === tripId
  ).length;
  const isChild = !!options?.parent_item_id;
  const item: PackingItem = {
    id,
    trip_id: tripId,
    item_name: itemName,
    quantity: isChild ? 1 : (options?.quantity ?? 1),
    category: options?.category ?? "miscellaneous",
    traveler_id: travelerId,
    parent_item_id: options?.parent_item_id ?? null,
    gear_item_id: options?.gear_item_id ?? null,
    user_id: options?.user_id ?? DEMO_USER.id,
    packed: false,
    shared: options?.shared ?? travelerId === null,
    activity_name: options?.activity_name ?? null,
    notes: null,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
  };
  store.packing_items.set(id, item);
  return item;
}

export function removeDemoPackingItem(itemId: string): void {
  const store = getStore();
  for (const [id, item] of store.packing_items) {
    if (item.parent_item_id === itemId) store.packing_items.delete(id);
  }
  store.packing_items.delete(itemId);
}

export function getDemoTemplates(userId: string): Template[] {
  return Array.from(getStore().templates.values()).filter((t) => t.user_id === userId);
}

export function getDemoChatMessages(tripId: string): ChatMessage[] {
  return Array.from(getStore().chat_messages.values())
    .filter((m) => m.trip_id === tripId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function addDemoChatMessage(
  tripId: string,
  userId: string | null,
  role: ChatMessage["role"],
  content: string
): ChatMessage {
  const store = getStore();
  const msg: ChatMessage = {
    id: uuid(),
    trip_id: tripId,
    user_id: userId,
    role,
    content,
    created_at: new Date().toISOString(),
  };
  store.chat_messages.set(msg.id, msg);
  return msg;
}

export function applyDemoItemUpdates(
  tripId: string,
  updates: {
    action: "add" | "remove" | "update";
    item_name: string;
    quantity?: number;
    category?: PackingItem["category"];
    shared?: boolean;
    traveler_name?: string;
  }[]
): void {
  const store = getStore();
  const now = new Date().toISOString();
  const travelers = Array.from(store.travelers.values()).filter((t) => t.trip_id === tripId);

  updates.forEach((update) => {
    if (update.action === "remove") {
      for (const [id, item] of store.packing_items) {
        if (item.trip_id === tripId && item.item_name === update.item_name) {
          store.packing_items.delete(id);
        }
      }
    } else if (update.action === "update") {
      for (const [id, item] of store.packing_items) {
        if (item.trip_id === tripId && item.item_name === update.item_name) {
          store.packing_items.set(id, {
            ...item,
            quantity: update.quantity ?? item.quantity,
            updated_at: now,
          });
        }
      }
    } else if (update.action === "add") {
      const traveler = travelers.find((t) => t.name === update.traveler_name);
      const id = uuid();
      store.packing_items.set(id, {
        id,
        trip_id: tripId,
        traveler_id: update.shared ? null : traveler?.id ?? null,
        parent_item_id: null,
        gear_item_id: null,
        user_id: DEMO_USER.id,
        category: update.category ?? "miscellaneous",
        item_name: update.item_name,
        quantity: update.quantity ?? 1,
        packed: false,
        shared: update.shared ?? false,
        activity_name: null,
        notes: null,
        sort_order: store.packing_items.size,
        created_at: now,
        updated_at: now,
      });
    }
  });
}

export function deleteDemoTrip(tripId: string): void {
  const store = getStore();
  store.trips.delete(tripId);
  for (const [id, t] of store.travelers) if (t.trip_id === tripId) store.travelers.delete(id);
  for (const [id, a] of store.activities) if (a.trip_id === tripId) store.activities.delete(id);
  for (const [id, p] of store.packing_items) if (p.trip_id === tripId) store.packing_items.delete(id);
  for (const [id, o] of store.outfits) if (o.trip_id === tripId) store.outfits.delete(id);
  for (const [id, c] of store.calendar_days) if (c.trip_id === tripId) store.calendar_days.delete(id);
  for (const [id, m] of store.chat_messages) if (m.trip_id === tripId) store.chat_messages.delete(id);
  for (const [id, item] of store.workspace_items) {
    if (item.trip_id === tripId) store.workspace_items.delete(id);
  }
}

export function calculateProgress(
  items: PackingItem[],
  travelers: Traveler[]
): PackingProgress {
  const topLevel = items.filter((i) => !i.parent_item_id);
  const total = topLevel.length;
  const packed = topLevel.filter((i) => i.packed).length;
  const byTraveler: PackingProgress["byTraveler"] = {};

  travelers.forEach((t) => {
    const travelerItems = topLevel.filter((i) => i.traveler_id === t.id);
    byTraveler[t.id] = {
      name: t.name,
      packed: travelerItems.filter((i) => i.packed).length,
      total: travelerItems.length,
    };
  });

  const sharedItems = topLevel.filter((i) => i.shared);
  byTraveler["shared"] = {
    name: "Shared",
    packed: sharedItems.filter((i) => i.packed).length,
    total: sharedItems.length,
  };

  return {
    total,
    packed,
    percentage: total > 0 ? Math.round((packed / total) * 100) : 0,
    byTraveler,
  };
}

export function saveDemoTemplate(
  userId: string,
  name: string,
  description: string,
  templateData: Template["template_data"]
): Template {
  const store = getStore();
  const now = new Date().toISOString();
  const template: Template = {
    id: uuid(),
    user_id: userId,
    name,
    description,
    template_data: templateData,
    created_at: now,
    updated_at: now,
  };
  store.templates.set(template.id, template);
  return template;
}

export function getDemoGearItems(userId: string): GearItem[] {
  const store = getStore();
  return Array.from(store.gear_items.values())
    .filter((item) => item.user_id === userId)
    .sort((a, b) => a.item_name.localeCompare(b.item_name));
}

export function addDemoGearItem(
  userId: string,
  input: Pick<GearItem, "item_name" | "category" | "description" | "color" | "subcategory">
): { item: GearItem; alreadyExists: boolean } {
  const store = getStore();
  const existing = Array.from(store.gear_items.values()).find(
    (item) => item.user_id === userId && item.item_name.toLowerCase() === input.item_name.toLowerCase()
  );
  if (existing) return { item: existing, alreadyExists: true };

  const now = new Date().toISOString();
  const item: GearItem = {
    id: uuid(),
    user_id: userId,
    item_name: input.item_name,
    category: input.category,
    description: input.description,
    color: input.color,
    subcategory: input.subcategory,
    created_at: now,
    updated_at: now,
  };
  store.gear_items.set(item.id, item);
  return { item, alreadyExists: false };
}

export function updateDemoGearItem(
  userId: string,
  itemId: string,
  updates: Partial<Pick<GearItem, "item_name" | "category" | "description" | "subcategory">>
) {
  const store = getStore();
  const item = store.gear_items.get(itemId);
  if (!item || item.user_id !== userId) return;
  store.gear_items.set(itemId, {
    ...item,
    ...updates,
    updated_at: new Date().toISOString(),
  });
}

export function deleteDemoGearItem(userId: string, itemId: string) {
  const store = getStore();
  const item = store.gear_items.get(itemId);
  if (!item || item.user_id !== userId) return;
  store.gear_items.delete(itemId);
}

export function getDemoGroupMembers(userId: string): GroupMember[] {
  const store = getStore();
  return Array.from(store.group_members.values())
    .filter((m) => m.user_id === userId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function addDemoGroupMember(
  userId: string,
  input: Pick<GroupMember, "name" | "traveler_type" | "pet_species" | "pet_size">
): { member: GroupMember; alreadyExists: boolean } {
  const store = getStore();
  const name = input.name.trim();
  const existing = Array.from(store.group_members.values()).find(
    (m) =>
      m.user_id === userId &&
      m.name.toLowerCase() === name.toLowerCase() &&
      m.traveler_type === input.traveler_type
  );
  if (existing) {
    if (input.traveler_type === "pet") {
      const updated: GroupMember = {
        ...existing,
        pet_species: input.pet_species ?? existing.pet_species ?? "dog",
        pet_size: input.pet_size ?? existing.pet_size ?? "medium",
        updated_at: new Date().toISOString(),
      };
      store.group_members.set(existing.id, updated);
      return { member: updated, alreadyExists: true };
    }
    return { member: existing, alreadyExists: true };
  }

  const now = new Date().toISOString();
  const member: GroupMember = {
    id: uuid(),
    user_id: userId,
    name,
    traveler_type: input.traveler_type,
    pet_species: input.traveler_type === "pet" ? (input.pet_species ?? "dog") : null,
    pet_size: input.traveler_type === "pet" ? (input.pet_size ?? "medium") : null,
    created_at: now,
    updated_at: now,
  };
  store.group_members.set(member.id, member);
  return { member, alreadyExists: false };
}

export function updateDemoGroupMember(
  userId: string,
  memberId: string,
  updates: Partial<Pick<GroupMember, "name" | "traveler_type" | "pet_species" | "pet_size">>
) {
  const store = getStore();
  const member = store.group_members.get(memberId);
  if (!member || member.user_id !== userId) return;
  store.group_members.set(memberId, {
    ...member,
    ...updates,
    name: updates.name?.trim() ?? member.name,
    updated_at: new Date().toISOString(),
  });
}

export function deleteDemoGroupMember(userId: string, memberId: string) {
  const store = getStore();
  const member = store.group_members.get(memberId);
  if (!member || member.user_id !== userId) return;
  store.group_members.delete(memberId);
}

export function getDemoTripByShareToken(token: string): Trip | null {
  const store = getStore();
  return Array.from(store.trips.values()).find((trip) => trip.share_token === token) ?? null;
}

export function joinDemoTripByShareToken(token: string, userId: string): string | null {
  const store = getStore();
  const trip = getDemoTripByShareToken(token);
  if (!trip) return null;
  if (trip.owner_id === userId) return trip.id;

  const existing = Array.from(store.trip_members.values()).find(
    (member) => member.trip_id === trip.id && member.user_id === userId
  );
  if (!existing) {
    const id = uuid();
    store.trip_members.set(id, {
      id,
      trip_id: trip.id,
      user_id: userId,
      role: "editor",
      created_at: new Date().toISOString(),
    });
  }
  return trip.id;
}

export function addDemoWorkspaceItem(
  tripId: string,
  kind: TripWorkspaceItem["kind"],
  title: string,
  details?: string | null
): TripWorkspaceItem {
  const store = getStore();
  const now = new Date().toISOString();
  const sortOrder = Array.from(store.workspace_items.values()).filter(
    (item) => item.trip_id === tripId && item.kind === kind
  ).length;
  const item: TripWorkspaceItem = {
    id: uuid(),
    trip_id: tripId,
    kind,
    title: title.trim(),
    details: details?.trim() || null,
    completed: false,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
  };
  store.workspace_items.set(item.id, item);
  return item;
}

export function toggleDemoWorkspaceItem(itemId: string, completed: boolean) {
  const store = getStore();
  const item = store.workspace_items.get(itemId);
  if (!item) return;
  store.workspace_items.set(itemId, {
    ...item,
    completed,
    updated_at: new Date().toISOString(),
  });
}

export function deleteDemoWorkspaceItem(itemId: string) {
  const store = getStore();
  store.workspace_items.delete(itemId);
}

export function updateDemoWorkspaceItem(
  tripId: string,
  itemId: string,
  updates: { title?: string; details?: string | null }
) {
  const store = getStore();
  const item = store.workspace_items.get(itemId);
  if (!item || item.trip_id !== tripId) return;

  const nextTitle =
    updates.title !== undefined ? updates.title.trim() : item.title;
  if (!nextTitle) return;

  store.workspace_items.set(itemId, {
    ...item,
    title: nextTitle,
    details:
      updates.details !== undefined
        ? updates.details?.trim() || null
        : item.details,
    updated_at: new Date().toISOString(),
  });
}

export function addDemoTripActivity(tripId: string, activityName: string): Activity {
  const store = getStore();
  const existing = Array.from(store.activities.values()).find(
    (activity) =>
      activity.trip_id === tripId &&
      activity.activity_name.toLowerCase() === activityName.trim().toLowerCase()
  );
  if (existing) return existing;

  const activity: Activity = {
    id: uuid(),
    trip_id: tripId,
    activity_name: activityName.trim(),
    created_at: new Date().toISOString(),
  };
  store.activities.set(activity.id, activity);
  return activity;
}

export function deleteDemoTripActivity(tripId: string, activityId: string) {
  const store = getStore();
  const activity = store.activities.get(activityId);
  if (!activity || activity.trip_id !== tripId) return;
  store.activities.delete(activityId);
}
