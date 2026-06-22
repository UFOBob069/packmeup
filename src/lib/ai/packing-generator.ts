import { getOpenAI } from "./openai";
import type {
  CalendarDay,
  Outfit,
  PackingCategory,
  PackingItem,
  PetSize,
  PetSpecies,
  TripOnboardingData,
  WeatherData,
} from "@/lib/types";
import { STYLE_LABELS } from "@/lib/types";
import { eachDayOfInterval, format, parseISO } from "date-fns";

export interface GeneratedTripContent {
  packing_items: Omit<PackingItem, "id" | "trip_id" | "created_at" | "updated_at">[];
  outfits: Omit<Outfit, "id" | "trip_id" | "created_at">[];
  calendar_days: Omit<CalendarDay, "id" | "trip_id" | "created_at">[];
}

function getStylePreferences(data: TripOnboardingData) {
  return data.style_preferences?.length ? data.style_preferences : [data.style_preference];
}

function formatTravelerForPrompt(t: TripOnboardingData["travelers"][number]) {
  if (t.traveler_type === "pet") {
    const species = t.pet_species ?? "dog";
    const size = t.pet_size ?? "medium";
    return `${t.name} (pet: ${species}, ${size})`;
  }
  return `${t.name} (${t.traveler_type})`;
}

function sanitizePackingAssignments(
  items: GeneratedTripContent["packing_items"],
  data: TripOnboardingData,
  travelerIds: { name: string; id: string }[]
): GeneratedTripContent["packing_items"] {
  const nameToId = Object.fromEntries(travelerIds.map((t) => [t.name, t.id]));
  const petIds = new Set(
    data.travelers
      .filter((t) => t.traveler_type === "pet")
      .map((t) => nameToId[t.name])
      .filter(Boolean)
  );
  const humanIds = data.travelers
    .filter((t) => t.traveler_type !== "pet")
    .map((t) => nameToId[t.name])
    .filter(Boolean);
  const defaultHumanId = humanIds[0] ?? null;

  return items.map((item) => {
    if (!item.traveler_id || !petIds.has(item.traveler_id)) return item;
    if (item.category === "pet_supplies") return item;
    return {
      ...item,
      traveler_id: defaultHumanId,
      shared: defaultHumanId ? false : item.shared,
    };
  });
}

function ensurePetSupplies(
  items: GeneratedTripContent["packing_items"],
  data: TripOnboardingData,
  travelerIds: { name: string; id: string }[],
  days: number
): GeneratedTripContent["packing_items"] {
  const nameToId = Object.fromEntries(travelerIds.map((t) => [t.name, t.id]));
  const pets = data.travelers.filter((t) => t.traveler_type === "pet");
  if (!pets.length) return items;

  const result = [...items];
  let sort = items.length;

  const hasPetItem = (petName: string, keyword: string) =>
    result.some(
      (i) =>
        i.traveler_id === nameToId[petName] &&
        i.category === "pet_supplies" &&
        i.item_name.toLowerCase().includes(keyword)
    );

  const addPetItem = (petName: string, item_name: string, quantity: number) => {
    result.push({
      item_name,
      quantity,
      category: "pet_supplies",
      traveler_id: nameToId[petName] ?? null,
      packed: false,
      shared: false,
      activity_name: null,
      notes: null,
      sort_order: sort++,
    });
  };

  pets.forEach((pet) => {
    const species = pet.pet_species ?? "dog";
    const size = pet.pet_size ?? "medium";
    const foodQty = Math.ceil(days * (size === "large" ? 1.25 : size === "small" ? 0.75 : 1));

    if (species === "cat") {
      if (!hasPetItem(pet.name, "carrier")) addPetItem(pet.name, "Cat Carrier", 1);
      if (!hasPetItem(pet.name, "food")) addPetItem(pet.name, "Cat Food", foodQty);
      if (!hasPetItem(pet.name, "litter")) addPetItem(pet.name, "Litter & Bags", 1);
    } else {
      if (!hasPetItem(pet.name, "leash")) addPetItem(pet.name, "Leash", 1);
      if (!hasPetItem(pet.name, "food")) addPetItem(pet.name, "Pet Food", foodQty);
      if (!hasPetItem(pet.name, "bowl")) addPetItem(pet.name, "Water Bowl", 1);
      if (!hasPetItem(pet.name, "waste")) addPetItem(pet.name, "Waste Bags", 1);
    }
    if (!hasPetItem(pet.name, "bed")) addPetItem(pet.name, "Pet Bed/Blanket", 1);
    if (!hasPetItem(pet.name, "health")) addPetItem(pet.name, "Pet Health Records", 1);
  });

  return result;
}

function ensureHumanBasics(
  items: GeneratedTripContent["packing_items"],
  data: TripOnboardingData,
  travelerIds: { name: string; id: string }[],
  days: number
): GeneratedTripContent["packing_items"] {
  const nameToId = Object.fromEntries(travelerIds.map((t) => [t.name, t.id]));
  const humans = data.travelers.filter((t) => t.traveler_type !== "pet");
  if (!humans.length) return items;

  const result = [...items];
  let sort = items.length;
  const laundryQty = data.laundry_access === "full" ? Math.ceil(days / 2) : days;
  const reduced =
    data.packing_mode === "minimalist" || data.packing_mode === "carry_on_optimized";
  const qty = reduced ? Math.min(laundryQty + 1, 6) : laundryQty + 1;

  const hasItem = (travelerId: string, keywords: string[]) =>
    result.some(
      (i) =>
        i.traveler_id === travelerId &&
        keywords.some((k) => i.item_name.toLowerCase().includes(k))
    );

  const addBasic = (travelerId: string, item_name: string, quantity: number) => {
    result.push({
      item_name,
      quantity,
      category: "clothing",
      traveler_id: travelerId,
      packed: false,
      shared: false,
      activity_name: null,
      notes: null,
      sort_order: sort++,
    });
  };

  humans.forEach((traveler) => {
    const id = nameToId[traveler.name];
    if (!id) return;
    if (!hasItem(id, ["underwear", "underpants", "briefs", "boxers", "panties", "bra"])) {
      addBasic(id, "Underwear", qty);
    }
    if (!hasItem(id, ["sock"])) {
      addBasic(id, "Socks", qty);
    }
  });

  return result;
}

function ensureCalendarDays(
  calendar_days: GeneratedTripContent["calendar_days"],
  data: TripOnboardingData,
  weather: WeatherData | null
): GeneratedTripContent["calendar_days"] {
  const range = eachDayOfInterval({
    start: parseISO(data.start_date),
    end: parseISO(data.end_date),
  });
  const byDate = new Map(calendar_days.map((d) => [d.trip_date, d]));
  const activities = data.activities.length ? data.activities : ["Sightseeing"];

  return range.map((day, i) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const existing = byDate.get(dateStr);
    if (existing) return existing;

    const isFirst = i === 0;
    const isLast = i === range.length - 1;
    const weatherDay = weather?.daily.find((d) => d.date === dateStr);
    const dayActivities = isFirst
      ? ["Travel Day"]
      : isLast
        ? ["Travel Home"]
        : [activities[i % activities.length]];

    return {
      trip_date: dateStr,
      title: isFirst ? "Travel Day" : isLast ? "Travel Home" : dayActivities[0],
      activities: dayActivities,
      weather_summary: weatherDay
        ? `${weatherDay.temp_high}°/${weatherDay.temp_low}°F, ${weatherDay.conditions}`
        : null,
    };
  });
}

export async function generateTripContent(
  data: TripOnboardingData,
  weather: WeatherData | null,
  travelerIds: { name: string; id: string }[]
): Promise<GeneratedTripContent> {
  const openai = getOpenAI();
  const days = eachDayOfInterval({
    start: parseISO(data.start_date),
    end: parseISO(data.end_date),
  }).length;

  let content: GeneratedTripContent;
  if (openai) {
    try {
      content = await generateWithOpenAI(data, weather, travelerIds, days);
    } catch (error) {
      console.error("OpenAI generation failed, using fallback:", error);
      content = generateFallbackContent(data, weather, travelerIds);
    }
  } else {
    content = generateFallbackContent(data, weather, travelerIds);
  }

  content.packing_items = sanitizePackingAssignments(content.packing_items, data, travelerIds);
  content.packing_items = ensureHumanBasics(content.packing_items, data, travelerIds, days);
  content.packing_items = ensurePetSupplies(content.packing_items, data, travelerIds, days);
  content.calendar_days = ensureCalendarDays(content.calendar_days, data, weather);
  return content;
}

async function generateWithOpenAI(
  data: TripOnboardingData,
  weather: WeatherData | null,
  travelerIds: { name: string; id: string }[],
  days: number
): Promise<GeneratedTripContent> {
  const openai = getOpenAI()!;
  const styles = getStylePreferences(data);

  const prompt = `Generate a complete travel packing plan as JSON for this trip:

Destination: ${data.destination}
Dates: ${data.start_date} to ${data.end_date} (${days} days)
Travelers: ${data.travelers.map(formatTravelerForPrompt).join(", ")}
Travel Type: ${data.travel_type}
Laundry Access: ${data.laundry_access}
Style (pick all that apply): ${styles.map((s) => STYLE_LABELS[s]).join(", ")}
Packing Mode: ${data.packing_mode}
Activities: ${data.activities.join(", ") || "General sightseeing"}
${data.is_multi_destination ? `Multi-destination: Yes${data.additional_destinations ? ` — also visiting ${data.additional_destinations}` : ""}` : "Multi-destination: No"}
Destination-specific details: ${data.destination_context || "None"}
Other notes: ${data.special_notes || "None"}
Weather: ${weather ? JSON.stringify(weather.daily) : "Unknown"}

Return JSON with this exact structure:
{
  "packing_items": [{"item_name": string, "quantity": number, "category": "clothing"|"shoes"|"toiletries"|"electronics"|"travel_documents"|"medications"|"activity_gear"|"pet_supplies"|"miscellaneous", "traveler_name": string|null, "shared": boolean, "activity_name": string|null}],
  "outfits": [{"trip_date": "YYYY-MM-DD", "time_of_day": "morning"|"afternoon"|"evening"|"all_day", "title": string, "description": string, "activity_name": string|null, "items": string[]}],
  "calendar_days": [{"trip_date": "YYYY-MM-DD", "title": string, "activities": string[], "weather_summary": string}]
}

Rules:
- Consolidate shared items (sunscreen, first aid) as shared:true
- Pet travelers ONLY receive pet_supplies items (food, leash, carrier, bowls, etc.)
- NEVER assign clothing, shoes, electronics, toiletries, or activity gear to pet travelers
- Assign human packing items only to adult, child, or infant travelers
- Match quantities to trip length and laundry access
- Respect packing mode (${data.packing_mode})
- Every human traveler MUST have underwear and socks with quantities based on trip length and laundry access
- Include activity-specific gear for human travelers
- Weather-aware clothing suggestions
- Blend all selected style preferences into the packing list`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an expert travel packing assistant. Return only valid JSON, no markdown.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(content);
  const nameToId = Object.fromEntries(travelerIds.map((t) => [t.name, t.id]));

  return {
    packing_items: (parsed.packing_items ?? []).map(
      (
        item: {
          item_name: string;
          quantity: number;
          category: PackingCategory;
          traveler_name: string | null;
          shared: boolean;
          activity_name: string | null;
        },
        i: number
      ) => ({
        item_name: item.item_name,
        quantity: item.quantity ?? 1,
        category: item.category,
        traveler_id: item.shared ? null : nameToId[item.traveler_name ?? ""] ?? null,
        packed: false,
        shared: item.shared ?? false,
        activity_name: item.activity_name,
        notes: null,
        sort_order: i,
      })
    ),
    outfits: (parsed.outfits ?? []).map(
      (o: {
        trip_date: string;
        time_of_day: Outfit["time_of_day"];
        title: string;
        description: string;
        activity_name: string | null;
        items: string[];
      }) => ({
        trip_date: o.trip_date,
        time_of_day: o.time_of_day ?? "morning",
        title: o.title,
        description: o.description,
        activity_name: o.activity_name,
        items: o.items ?? [],
      })
    ),
    calendar_days: (parsed.calendar_days ?? []).map(
      (d: {
        trip_date: string;
        title: string;
        activities: string[];
        weather_summary: string;
      }) => ({
        trip_date: d.trip_date,
        title: d.title,
        activities: d.activities ?? [],
        weather_summary: d.weather_summary ?? null,
      })
    ),
  };
}

function addPetItemsForTraveler(
  addItem: (
    item_name: string,
    quantity: number,
    category: PackingCategory,
    traveler_name: string | null,
    shared: boolean,
    activity_name?: string | null
  ) => void,
  pet: TripOnboardingData["travelers"][number],
  days: number
) {
  const species: PetSpecies = pet.pet_species ?? "dog";
  const size: PetSize = pet.pet_size ?? "medium";
  const foodQty = Math.ceil(days * (size === "large" ? 1.25 : size === "small" ? 0.75 : 1));

  if (species === "cat") {
    addItem("Cat Carrier", 1, "pet_supplies", pet.name, false);
    addItem("Cat Food", foodQty, "pet_supplies", pet.name, false);
    addItem("Litter & Bags", 1, "pet_supplies", pet.name, false);
  } else {
    addItem("Leash", 1, "pet_supplies", pet.name, false);
    addItem("Pet Food", foodQty, "pet_supplies", pet.name, false);
    addItem("Water Bowl", 1, "pet_supplies", pet.name, false);
    addItem("Waste Bags", 1, "pet_supplies", pet.name, false);
  }
  addItem("Pet Bed/Blanket", 1, "pet_supplies", pet.name, false);
  addItem("Pet Health Records", 1, "pet_supplies", pet.name, false);
}

function generateFallbackContent(
  data: TripOnboardingData,
  weather: WeatherData | null,
  travelerIds: { name: string; id: string }[]
): GeneratedTripContent {
  const days = eachDayOfInterval({
    start: parseISO(data.start_date),
    end: parseISO(data.end_date),
  });
  const nameToId = Object.fromEntries(travelerIds.map((t) => [t.name, t.id]));
  const adults = data.travelers.filter((t) => t.traveler_type !== "pet");
  const pets = data.travelers.filter((t) => t.traveler_type === "pet");
  const styles = getStylePreferences(data);
  const avgHigh = weather?.daily.length
    ? weather.daily.reduce((s, d) => s + d.temp_high, 0) / weather.daily.length
    : 72;
  const rainy = weather?.daily.some((d) => d.rain_chance > 40) ?? false;
  const cold = avgHigh < 55;

  const items: GeneratedTripContent["packing_items"] = [];
  let sort = 0;

  const addItem = (
    item_name: string,
    quantity: number,
    category: PackingCategory,
    traveler_name: string | null,
    shared: boolean,
    activity_name: string | null = null
  ) => {
    items.push({
      item_name,
      quantity,
      category,
      traveler_id: shared ? null : nameToId[traveler_name ?? ""] ?? null,
      packed: false,
      shared,
      activity_name,
      notes: null,
      sort_order: sort++,
    });
  };

  // Shared essentials
  addItem("Sunscreen SPF 50", 1, "toiletries", null, true);
  addItem("First Aid Kit", 1, "miscellaneous", null, true);
  addItem("Portable Phone Charger", 1, "electronics", null, true);
  if (rainy) addItem("Compact Umbrella", 1, "miscellaneous", null, true);

  adults.forEach((traveler) => {
    const qty = data.laundry_access === "full" ? Math.ceil(days.length / 2) : days.length;
    const reduced = data.packing_mode === "minimalist" || data.packing_mode === "carry_on_optimized";
    const tops = reduced ? Math.min(qty, 4) : qty;
    const bottoms = reduced ? Math.min(Math.ceil(qty / 2), 3) : Math.ceil(qty / 2);

    addItem("T-Shirts", tops, "clothing", traveler.name, false);
    addItem("Shorts", bottoms, "clothing", traveler.name, false);
    if (cold) {
      addItem("Light Jacket", 1, "clothing", traveler.name, false);
      addItem("Long Pants", 2, "clothing", traveler.name, false);
    }
    if (rainy) addItem("Rain Jacket", 1, "clothing", traveler.name, false);

    addItem("Underwear", tops + 1, "clothing", traveler.name, false);
    addItem("Socks", tops + 1, "clothing", traveler.name, false);
    addItem("Comfortable Walking Shoes", 1, "shoes", traveler.name, false);
    addItem("Toiletry Bag", 1, "toiletries", traveler.name, false);
    addItem("Toothbrush & Toothpaste", 1, "toiletries", traveler.name, false);
    addItem("Phone Charger", 1, "electronics", traveler.name, false);
    addItem("Passport/ID", 1, "travel_documents", traveler.name, false);

    if (styles.includes("smart_casual") || styles.includes("business")) {
      addItem("Chinos", 2, "clothing", traveler.name, false);
      addItem("Polo Shirts", 2, "clothing", traveler.name, false);
      addItem("Dress Shoes", 1, "shoes", traveler.name, false);
    }
    if (styles.includes("formal")) {
      addItem("Formal Outfit", 1, "clothing", traveler.name, false);
      addItem("Dress Shoes", 1, "shoes", traveler.name, false);
    }
    if (styles.includes("athletic")) {
      addItem("Athletic Shorts", 2, "clothing", traveler.name, false);
      addItem("Running Shoes", 1, "shoes", traveler.name, false);
    }
    if (styles.includes("minimalist")) {
      addItem("Neutral Layer", 1, "clothing", traveler.name, false);
    }
  });

  // Activity gear
  data.activities.forEach((activity) => {
    const act = activity.toLowerCase();
    if (act.includes("golf")) {
      adults.forEach((t) => {
        addItem("Golf Polo", 2, "clothing", t.name, false, "Golf");
        addItem("Golf Shorts", 2, "clothing", t.name, false, "Golf");
        addItem("Golf Shoes", 1, "shoes", t.name, false, "Golf");
        addItem("Golf Glove", 1, "activity_gear", t.name, false, "Golf");
        addItem("Golf Hat", 1, "clothing", t.name, false, "Golf");
      });
    }
    if (act.includes("beach") || act.includes("pool")) {
      adults.forEach((t) => {
        addItem("Swimsuit", 1, "clothing", t.name, false, activity);
        addItem("Flip Flops", 1, "shoes", t.name, false, activity);
      });
      addItem("Beach Towel", adults.length, "miscellaneous", null, true, activity);
    }
    if (act.includes("hiking")) {
      adults.forEach((t) => {
        addItem("Hiking Boots", 1, "shoes", t.name, false, "Hiking");
        addItem("Hiking Pants", 1, "clothing", t.name, false, "Hiking");
        addItem("Daypack", 1, "activity_gear", t.name, false, "Hiking");
      });
    }
    if (act.includes("wedding")) {
      adults.forEach((t) => {
        addItem("Formal Outfit", 1, "clothing", t.name, false, "Wedding");
        addItem("Dress Shoes", 1, "shoes", t.name, false, "Wedding");
        addItem("Belt", 1, "clothing", t.name, false, "Wedding");
      });
    }
    if (act.includes("ski")) {
      adults.forEach((t) => {
        addItem("Ski Jacket", 1, "clothing", t.name, false, "Skiing");
        addItem("Ski Pants", 1, "clothing", t.name, false, "Skiing");
        addItem("Thermal Base Layers", 2, "clothing", t.name, false, "Skiing");
        addItem("Ski Goggles", 1, "activity_gear", t.name, false, "Skiing");
      });
    }
    if (act.includes("gym") || act.includes("running")) {
      adults.forEach((t) => {
        addItem("Athletic Shorts", 2, "clothing", t.name, false, activity);
        addItem("Running Shoes", 1, "shoes", t.name, false, activity);
        addItem("Workout Top", 2, "clothing", t.name, false, activity);
      });
    }
    if (act.includes("dinner")) {
      adults.forEach((t) => {
        addItem("Nice Dinner Outfit", 1, "clothing", t.name, false, "Nice Dinners");
      });
    }
  });

  pets.forEach((pet) => addPetItemsForTraveler(addItem, pet, days.length));

  const outfits: GeneratedTripContent["outfits"] = [];
  const calendar_days: GeneratedTripContent["calendar_days"] = [];

  days.forEach((day, i) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const weatherDay = weather?.daily.find((d) => d.date === dateStr);
    const isFirst = i === 0;
    const isLast = i === days.length - 1;

    const dayActivities = isFirst
      ? ["Travel Day"]
      : isLast
        ? ["Travel Home"]
        : data.activities.length > 0
          ? [data.activities[i % data.activities.length]]
          : ["Sightseeing"];

    calendar_days.push({
      trip_date: dateStr,
      title: isFirst ? "Travel Day" : isLast ? "Travel Home" : dayActivities[0],
      activities: dayActivities,
      weather_summary: weatherDay
        ? `${weatherDay.temp_high}°/${weatherDay.temp_low}°F, ${weatherDay.conditions}`
        : null,
    });

    if (!isFirst && !isLast && adults.length > 0) {
      const activity = dayActivities[0];
      if (activity.toLowerCase().includes("golf")) {
        outfits.push({
          trip_date: dateStr,
          time_of_day: "morning",
          title: "Golf Outfit",
          description: "Comfortable course-ready look",
          activity_name: "Golf",
          items: ["Blue Polo", "Khaki Shorts", "White Hat", "Golf Shoes"],
        });
        outfits.push({
          trip_date: dateStr,
          time_of_day: "evening",
          title: "Dinner Outfit",
          description: "Smart casual for evening",
          activity_name: "Nice Dinners",
          items: ["Black Polo", "Chinos", "Loafers"],
        });
      } else {
        outfits.push({
          trip_date: dateStr,
          time_of_day: "all_day",
          title: `${activity} Outfit`,
          description: `Comfortable outfit for ${activity.toLowerCase()}`,
          activity_name: activity,
          items: ["Casual Top", "Comfortable Shorts", "Walking Shoes"],
        });
      }
    }
  });

  return { packing_items: items, outfits, calendar_days };
}
