import { getOpenAI } from "./openai";
import type { PackingCategory, PackingItem, TripOnboardingData } from "@/lib/types";

export interface PackingItemSuggestion {
  item_name: string;
  quantity: number;
  category: PackingCategory;
  shared: boolean;
  traveler_name: string | null;
}

export interface ChatRefinementResult {
  message: string;
  item_updates: {
    action: "add" | "remove" | "update";
    item_name: string;
    quantity?: number;
    category?: PackingItem["category"];
    shared?: boolean;
    traveler_name?: string;
  }[];
  suggestions: PackingItemSuggestion[];
  trip_updates?: Partial<TripOnboardingData>;
}

interface TravelerContext {
  name: string;
  type: string;
  pet_species?: string | null;
  pet_size?: string | null;
}

interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export async function refineWithChat(
  userMessage: string,
  tripContext: {
    destination: string;
    packing_mode: string;
    travel_type: string;
    items: Pick<PackingItem, "item_name" | "quantity" | "category" | "shared">[];
    travelers: TravelerContext[];
  },
  chatHistory: ChatHistoryMessage[] = []
): Promise<ChatRefinementResult> {
  const openai = getOpenAI();

  if (openai) {
    try {
      const travelerDesc = tripContext.travelers
        .map((t) => {
          if (t.type === "pet") {
            return `${t.name} (pet${t.pet_species ? `: ${t.pet_species}` : ""}${t.pet_size ? `, ${t.pet_size}` : ""})`;
          }
          return `${t.name} (${t.type})`;
        })
        .join(", ");

      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        {
          role: "system",
          content: `You are a travel packing assistant. Help refine packing lists based on user requests.

Return JSON with this exact shape:
{
  "message": "friendly conversational reply",
  "item_updates": [{"action": "remove"|"update", "item_name": string, "quantity": number}],
  "suggestions": [{"item_name": string, "quantity": number, "category": "clothing"|"shoes"|"toiletries"|"electronics"|"travel_documents"|"medications"|"activity_gear"|"pet_supplies"|"miscellaneous", "shared": boolean, "traveler_name": string|null}]
}

Rules:
- Put ALL new items in "suggestions" — never use item_updates with action "add"
- suggestions are shown as clickable buttons the user confirms before adding
- item_updates is only for remove or quantity update (auto-applied)
- For pets/dogs, use category "pet_supplies" and assign traveler_name to the pet
- Never assign clothing or human items to pet travelers
- Use conversation history — if user says "yes" or "add them", act on your previous suggestion
- Be specific with item names and quantities
- If user mentions a pet not on the traveler list, still suggest pet items and mention they can add the pet in trip settings

Current trip: ${tripContext.destination}, mode: ${tripContext.packing_mode}, type: ${tripContext.travel_type}
Travelers: ${travelerDesc}
Current items (${tripContext.items.length}): ${JSON.stringify(tripContext.items.slice(0, 60))}`,
        },
        ...chatHistory.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage },
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content) as ChatRefinementResult;
        return {
          message: parsed.message ?? "Here's what I'd add to your list.",
          item_updates: parsed.item_updates ?? [],
          suggestions: normalizeSuggestions(parsed.suggestions ?? [], tripContext),
        };
      }
    } catch (error) {
      console.error("Chat refinement failed:", error);
    }
  }

  return getFallbackRefinement(userMessage, tripContext, chatHistory);
}

function normalizeSuggestions(
  suggestions: PackingItemSuggestion[],
  tripContext: { travelers: TravelerContext[] }
): PackingItemSuggestion[] {
  const petNames = new Set(
    tripContext.travelers.filter((t) => t.type === "pet").map((t) => t.name)
  );

  return suggestions.map((s) => {
    if (s.traveler_name && petNames.has(s.traveler_name)) {
      return { ...s, category: "pet_supplies" as PackingCategory, shared: false };
    }
    return s;
  });
}

function getFallbackRefinement(
  userMessage: string,
  tripContext: {
    items: Pick<PackingItem, "item_name" | "quantity" | "category" | "shared">[];
    travelers: TravelerContext[];
  },
  chatHistory: ChatHistoryMessage[]
): ChatRefinementResult {
  const lower = userMessage.toLowerCase();
  const combined = [...chatHistory.map((m) => m.content.toLowerCase()), lower].join(" ");
  const updates: ChatRefinementResult["item_updates"] = [];
  const suggestions: PackingItemSuggestion[] = [];
  let message = "Here's what I'd add — tap any item to put it on your list.";

  const pet = tripContext.travelers.find((t) => t.type === "pet");
  const human = tripContext.travelers.find((t) => t.type !== "pet");
  const travelerName = human?.name ?? tripContext.travelers[0]?.name ?? null;

  const wantsPetItems =
    combined.includes("dog") ||
    combined.includes("pet") ||
    combined.includes("cat") ||
    lower === "yes";

  if (wantsPetItems) {
    const petName = pet?.name ?? "Pet";
    const species = pet?.pet_species ?? (combined.includes("cat") ? "cat" : "dog");
    message = pet
      ? `Here are essentials for ${petName}. Tap to add:`
      : `I don't see a pet on your traveler list yet, but here are items you'd need. Tap to add:`;

    if (species === "cat") {
      suggestions.push(
        { item_name: "Cat Carrier", quantity: 1, category: "pet_supplies", shared: false, traveler_name: petName },
        { item_name: "Cat Food", quantity: 3, category: "pet_supplies", shared: false, traveler_name: petName },
        { item_name: "Litter & Bags", quantity: 1, category: "pet_supplies", shared: false, traveler_name: petName }
      );
    } else {
      suggestions.push(
        { item_name: "Leash", quantity: 1, category: "pet_supplies", shared: false, traveler_name: petName },
        { item_name: "Pet Food", quantity: 3, category: "pet_supplies", shared: false, traveler_name: petName },
        { item_name: "Water Bowl", quantity: 1, category: "pet_supplies", shared: false, traveler_name: petName },
        { item_name: "Waste Bags", quantity: 1, category: "pet_supplies", shared: false, traveler_name: petName }
      );
    }
    suggestions.push(
      { item_name: "Pet Bed/Blanket", quantity: 1, category: "pet_supplies", shared: false, traveler_name: petName },
      { item_name: "Pet Health Records", quantity: 1, category: "pet_supplies", shared: false, traveler_name: petName }
    );
  } else if (lower.includes("carry-on") || lower.includes("carry on")) {
    message = "I'll trim bulky items. Tap to add carry-on helpers:";
    updates.push(
      { action: "remove", item_name: "Beach Towel" },
      { action: "update", item_name: "T-Shirts", quantity: 4 }
    );
    suggestions.push(
      { item_name: "Packing Cubes", quantity: 2, category: "miscellaneous", shared: true, traveler_name: null }
    );
  } else if (lower.includes("golf")) {
    message = "Added golf day essentials — tap to add:";
    suggestions.push(
      { item_name: "Golf Polo", quantity: 2, category: "clothing", shared: false, traveler_name: travelerName },
      { item_name: "Golf Balls", quantity: 1, category: "activity_gear", shared: false, traveler_name: travelerName },
      { item_name: "Golf Tees", quantity: 1, category: "activity_gear", shared: false, traveler_name: travelerName }
    );
  } else if (lower.includes("wedding")) {
    message = "Wedding outfit essentials — tap to add:";
    suggestions.push(
      { item_name: "Formal Outfit", quantity: 1, category: "clothing", shared: false, traveler_name: travelerName },
      { item_name: "Dress Shoes", quantity: 1, category: "shoes", shared: false, traveler_name: travelerName }
    );
  } else if (lower.includes("cold") || lower.includes("colder")) {
    message = "Colder weather layers — tap to add:";
    suggestions.push(
      { item_name: "Warm Jacket", quantity: 1, category: "clothing", shared: false, traveler_name: travelerName },
      { item_name: "Thermal Layers", quantity: 2, category: "clothing", shared: false, traveler_name: travelerName }
    );
  } else if (lower.includes("reduce") || lower.includes("minimal")) {
    message = "Trimmed quantities on your list.";
    updates.push(
      { action: "update", item_name: "T-Shirts", quantity: 3 },
      { action: "update", item_name: "Shorts", quantity: 2 },
      { action: "remove", item_name: "Portable Speaker" }
    );
  } else {
    message =
      "Tell me what you need — e.g. \"add my dog's supplies\", \"add golf gear\", or \"make this carry-on friendly\".";
  }

  return { message, item_updates: updates, suggestions };
}
