import type { PackingCategory } from "./types";

export const APP_NAME = "Pack Me Up";
export const APP_DESCRIPTION =
  "AI-powered travel packing assistant for smarter trips with friends, family, and pets.";

export const ONBOARDING_STEPS = [
  "destination",
  "dates",
  "travelers",
  "travel_type",
  "laundry",
  "style",
  "activities",
  "packing_mode",
  "notes",
  "review",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const CATEGORY_ICONS: Record<PackingCategory, string> = {
  clothing: "👕",
  shoes: "👟",
  toiletries: "🧴",
  electronics: "📱",
  travel_documents: "📄",
  medications: "💊",
  activity_gear: "⛳",
  pet_supplies: "🐾",
  miscellaneous: "📦",
};

export const DEMO_USER = {
  id: "demo-user-001",
  email: "demo@packmeup.app",
  name: "Demo User",
};
