import type { TripOnboardingData } from "./types";

export function buildTripSpecialNotes(data: TripOnboardingData): string {
  const parts: string[] = [];

  if (data.is_multi_destination) {
    const stops = data.additional_destinations?.trim();
    parts.push(
      stops
        ? `Multi-destination trip: ${data.destination}; also visiting ${stops}`
        : `Multi-destination trip with ${data.destination} as the primary stop`
    );
  }

  if (data.destination_context?.trim()) {
    parts.push(data.destination_context.trim());
  }

  if (data.special_notes?.trim()) {
    parts.push(data.special_notes.trim());
  }

  return parts.join("\n\n");
}
