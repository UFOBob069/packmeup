import { getOpenAI } from "./openai";

export interface DestinationQuestionResult {
  question: string;
  hints: string[];
}

const FALLBACK_HINTS = [
  "Formal events",
  "Outdoor activities",
  "Dress codes",
  "Side trips",
];

const WEATHER_PATTERN =
  /\b(weather|rain|rains|rainy|snow|snowy|temperature|forecast|humid|humidity|sunny|chilly|cold nights|hot days|layer|layers for)\b/i;

function isWeatherRelated(text: string): boolean {
  return WEATHER_PATTERN.test(text);
}

function sanitizeQuestionResult(
  destination: string,
  result: DestinationQuestionResult
): DestinationQuestionResult {
  if (isWeatherRelated(result.question)) {
    return getFallbackDestinationQuestion(destination);
  }

  const hints = result.hints.filter((h) => !isWeatherRelated(h)).slice(0, 4);

  return {
    question: result.question,
    hints: hints.length ? hints : FALLBACK_HINTS,
  };
}

export function getFallbackDestinationQuestion(destination: string): DestinationQuestionResult {
  const city = destination.split(",")[0]?.trim() || destination.trim();
  return {
    question: `Any special plans in ${city} we should pack for? (We’ll pull the weather forecast automatically once you set your dates.)`,
    hints: FALLBACK_HINTS,
  };
}

export async function generateDestinationQuestion(
  destination: string
): Promise<DestinationQuestionResult> {
  const openai = getOpenAI();
  if (!openai) return getFallbackDestinationQuestion(destination);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a travel packing expert. Given a trip destination, ask ONE friendly question about destination-specific details that would change what someone packs. Also suggest 2-4 short hint topics as chips.

Return JSON: {"question": string, "hints": string[]}

Rules:
- Question should be conversational, under 160 characters
- Focus on things the app CANNOT look up: planned activities, dress codes, cultural norms, formal events, hiking/beach/water plans, altitude sensitivity, international power adapters, theme parks, weddings, business meetings, etc.
- NEVER ask about weather, temperature, rain, snow, forecast, seasons, or what to wear for hot/cold — the app fetches live weather automatically after the user picks dates
- Do not ask about dates or travelers
- hints are 2-4 word labels like "Business dinners", "Hiking trails", "Wedding guest" — no weather-related hints`,
        },
        {
          role: "user",
          content: `Destination: ${destination}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return getFallbackDestinationQuestion(destination);

    const parsed = JSON.parse(content) as { question?: string; hints?: string[] };
    if (!parsed.question?.trim()) return getFallbackDestinationQuestion(destination);

    return sanitizeQuestionResult(destination, {
      question: parsed.question.trim(),
      hints: parsed.hints?.filter(Boolean).slice(0, 4) ?? FALLBACK_HINTS,
    });
  } catch (error) {
    console.error("Destination question generation failed:", error);
    return getFallbackDestinationQuestion(destination);
  }
}
