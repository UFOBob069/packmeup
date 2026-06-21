"use server";

import { generateDestinationQuestion } from "@/lib/ai/destination-question";

export async function getDestinationQuestion(destination: string) {
  const trimmed = destination.trim();
  if (!trimmed) {
    throw new Error("Destination is required");
  }
  return generateDestinationQuestion(trimmed);
}
