import { getOpenAI } from "./openai";

export interface DestinationQuestionResult {
  question: string;
  hints: string[];
}

const FALLBACK_HINTS = [
  "Local weather quirks or season",
  "Planned side trips or stops",
  "Dress codes or cultural norms",
];

export function getFallbackDestinationQuestion(destination: string): DestinationQuestionResult {
  return {
    question: `Anything specific about ${destination} we should factor into your packing list?`,
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
          content: `You are a travel packing expert. Given a trip destination, ask ONE friendly question about destination-specific details that would change what someone packs. Also suggest 2-3 short hint topics as chips.

Return JSON: {"question": string, "hints": string[]}
Rules:
- Question should be conversational, under 140 characters
- Focus on packing-relevant details: climate quirks, activities, cultural dress codes, altitude, beach vs city, international adapters, formal events, hiking terrain, etc.
- hints are 2-4 word labels like "Beach days", "Business dinners", "Cold nights"
- Do not ask about dates or travelers — only destination-specific packing context`,
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

    return {
      question: parsed.question.trim(),
      hints: parsed.hints?.filter(Boolean).slice(0, 4) ?? FALLBACK_HINTS,
    };
  } catch (error) {
    console.error("Destination question generation failed:", error);
    return getFallbackDestinationQuestion(destination);
  }
}
