import type {
  Activity,
  CalendarDay,
  ChatMessage,
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
} from "@/lib/types";
import { DEMO_USER } from "@/lib/constants";
import { generateTripContent } from "@/lib/ai/packing-generator";
import { buildTripSpecialNotes } from "@/lib/trip-notes";
import { fetchWeather } from "@/lib/weather/weather-service";

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
  currentUserId: string;
}

const globalForDemo = globalThis as unknown as { demoStore?: DemoStore };

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
      currentUserId: DEMO_USER.id,
    };
    seedDemoData(globalForDemo.demoStore);
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
    weather_data: null,
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
    { id: "pi-1", trip_id: tripId, traveler_id: "t-david", category: "clothing", item_name: "Golf Polo", quantity: 2, packed: true, shared: false, activity_name: "Golf", notes: null, sort_order: 0 },
    { id: "pi-2", trip_id: tripId, traveler_id: "t-david", category: "shoes", item_name: "Golf Shoes", quantity: 1, packed: false, shared: false, activity_name: "Golf", notes: null, sort_order: 1 },
    { id: "pi-3", trip_id: tripId, traveler_id: "t-jen", category: "clothing", item_name: "Swimsuit", quantity: 1, packed: true, shared: false, activity_name: "Pool", notes: null, sort_order: 2 },
    { id: "pi-4", trip_id: tripId, traveler_id: null, category: "toiletries", item_name: "Sunscreen SPF 50", quantity: 1, packed: false, shared: true, activity_name: null, notes: null, sort_order: 3 },
    { id: "pi-5", trip_id: tripId, traveler_id: "t-andre", category: "pet_supplies", item_name: "Dog Leash", quantity: 1, packed: true, shared: false, activity_name: null, notes: null, sort_order: 4 },
    { id: "pi-6", trip_id: tripId, traveler_id: "t-andre", category: "pet_supplies", item_name: "Dog Food", quantity: 5, packed: false, shared: false, activity_name: null, notes: null, sort_order: 5 },
    { id: "pi-7", trip_id: tripId, traveler_id: "t-david", category: "clothing", item_name: "Chinos", quantity: 2, packed: false, shared: false, activity_name: null, notes: null, sort_order: 6 },
    { id: "pi-8", trip_id: tripId, traveler_id: null, category: "electronics", item_name: "Portable Phone Charger", quantity: 1, packed: true, shared: true, activity_name: null, notes: null, sort_order: 7 },
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

export function getDemoTripWithDetails(tripId: string): TripWithDetails | null {
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
      .filter((p) => p.trip_id === tripId)
      .sort((a, b) => a.sort_order - b.sort_order),
    outfits: Array.from(store.outfits.values()).filter((o) => o.trip_id === tripId),
    calendar_days: Array.from(store.calendar_days.values()).filter((c) => c.trip_id === tripId),
    members: Array.from(store.trip_members.values()).filter((m) => m.trip_id === tripId),
  };
}

export async function createDemoTrip(
  userId: string,
  data: TripOnboardingData
): Promise<TripWithDetails> {
  const store = getStore();
  const now = new Date().toISOString();
  const tripId = uuid();

  const weather = await fetchWeather(data.destination, data.start_date, data.end_date);

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

  data.activities.forEach((name) => {
    const id = uuid();
    store.activities.set(id, { id, trip_id: tripId, activity_name: name, created_at: now });
  });

  const generated = await generateTripContent(data, weather, travelerIds);

  generated.packing_items.forEach((item) => {
    const id = uuid();
    store.packing_items.set(id, {
      ...item,
      id,
      trip_id: tripId,
      created_at: now,
      updated_at: now,
    });
  });

  generated.outfits.forEach((outfit) => {
    const id = uuid();
    store.outfits.set(id, { ...outfit, id, trip_id: tripId, created_at: now });
  });

  generated.calendar_days.forEach((day) => {
    const id = uuid();
    store.calendar_days.set(id, { ...day, id, trip_id: tripId, created_at: now });
  });

  return getDemoTripWithDetails(tripId)!;
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

export function addDemoPackingItem(
  tripId: string,
  itemName: string,
  travelerId: string | null,
  options?: { quantity?: number; category?: PackingItem["category"] }
): PackingItem {
  const store = getStore();
  const now = new Date().toISOString();
  const id = uuid();
  const sortOrder = Array.from(store.packing_items.values()).filter(
    (i) => i.trip_id === tripId
  ).length;
  const item: PackingItem = {
    id,
    trip_id: tripId,
    item_name: itemName,
    quantity: options?.quantity ?? 1,
    category: options?.category ?? "miscellaneous",
    traveler_id: travelerId,
    packed: false,
    shared: travelerId === null,
    activity_name: null,
    notes: null,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
  };
  store.packing_items.set(id, item);
  return item;
}

export function removeDemoPackingItem(itemId: string): void {
  getStore().packing_items.delete(itemId);
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
}

export function calculateProgress(
  items: PackingItem[],
  travelers: Traveler[]
): PackingProgress {
  const total = items.length;
  const packed = items.filter((i) => i.packed).length;
  const byTraveler: PackingProgress["byTraveler"] = {};

  travelers.forEach((t) => {
    const travelerItems = items.filter((i) => i.traveler_id === t.id);
    byTraveler[t.id] = {
      name: t.name,
      packed: travelerItems.filter((i) => i.packed).length,
      total: travelerItems.length,
    };
  });

  const sharedItems = items.filter((i) => i.shared);
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
