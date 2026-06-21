import { getOpenAI } from "./openai";
import type { PackingItem, TripOnboardingData } from "@/lib/types";

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
  trip_updates?: Partial<TripOnboardingData>;
}

export async function refineWithChat(
  userMessage: string,
  tripContext: {
    destination: string;
    packing_mode: string;
    travel_type: string;
    items: Pick<PackingItem, "item_name" | "quantity" | "category" | "shared">[];
    travelers: { name: string }[];
  }
): Promise<ChatRefinementResult> {
  const openai = getOpenAI();

  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a travel packing assistant. Help refine packing lists based on user requests.
Return JSON: {"message": string, "item_updates": [{"action": "add"|"remove"|"update", "item_name": string, "quantity": number, "category": string, "shared": boolean, "traveler_name": string|null}]}
Current trip: ${tripContext.destination}, mode: ${tripContext.packing_mode}, type: ${tripContext.travel_type}
Travelers: ${tripContext.travelers.map((t) => t.name).join(", ")}
Current items: ${JSON.stringify(tripContext.items.slice(0, 50))}`,
          },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content;
      if (content) return JSON.parse(content) as ChatRefinementResult;
    } catch (error) {
      console.error("Chat refinement failed:", error);
    }
  }

  return getFallbackRefinement(userMessage, tripContext);
}

function getFallbackRefinement(
  userMessage: string,
  tripContext: {
    items: Pick<PackingItem, "item_name" | "quantity" | "category" | "shared">[];
    travelers: { name: string }[];
  }
): ChatRefinementResult {
  const lower = userMessage.toLowerCase();
  const updates: ChatRefinementResult["item_updates"] = [];
  let message = "I've updated your packing list based on your request.";

  if (lower.includes("carry-on") || lower.includes("carry on")) {
    message =
      "I've optimized your list for carry-on travel — reduced quantities and removed bulky items.";
    updates.push(
      { action: "remove", item_name: "Beach Towel" },
      { action: "update", item_name: "T-Shirts", quantity: 4 },
      { action: "add", item_name: "Packing Cubes", quantity: 2, category: "miscellaneous", shared: true }
    );
  } else if (lower.includes("golf")) {
    message = "Added golf day essentials to your packing list.";
    const traveler = tripContext.travelers[0]?.name;
    updates.push(
      { action: "add", item_name: "Golf Polo", quantity: 2, category: "clothing", shared: false, traveler_name: traveler },
      { action: "add", item_name: "Golf Balls", quantity: 1, category: "activity_gear", shared: false, traveler_name: traveler },
      { action: "add", item_name: "Golf Tees", quantity: 1, category: "activity_gear", shared: false, traveler_name: traveler }
    );
  } else if (lower.includes("wedding")) {
    message = "Added wedding outfit essentials.";
    const traveler = tripContext.travelers[0]?.name;
    updates.push(
      { action: "add", item_name: "Suit/Formal Dress", quantity: 1, category: "clothing", shared: false, traveler_name: traveler },
      { action: "add", item_name: "Dress Shoes", quantity: 1, category: "shoes", shared: false, traveler_name: traveler },
      { action: "add", item_name: "Tie/Accessories", quantity: 1, category: "clothing", shared: false, traveler_name: traveler }
    );
  } else if (lower.includes("cold") || lower.includes("colder")) {
    message = "Added colder weather layers to your list.";
    const traveler = tripContext.travelers[0]?.name;
    updates.push(
      { action: "add", item_name: "Warm Jacket", quantity: 1, category: "clothing", shared: false, traveler_name: traveler },
      { action: "add", item_name: "Thermal Layers", quantity: 2, category: "clothing", shared: false, traveler_name: traveler },
      { action: "add", item_name: "Beanie", quantity: 1, category: "clothing", shared: false, traveler_name: traveler }
    );
  } else if (lower.includes("reduce") || lower.includes("minimal")) {
    message = "Trimmed your list to reduce overpacking.";
    updates.push(
      { action: "update", item_name: "T-Shirts", quantity: 3 },
      { action: "update", item_name: "Shorts", quantity: 2 },
      { action: "remove", item_name: "Portable Speaker" }
    );
  } else {
    message =
      "I can help with that! Try asking me to optimize for carry-on, add activity gear, adjust for weather, or reduce overpacking.";
  }

  return { message, item_updates: updates };
}
