import type { PackingItem, Traveler, WeatherData } from "./types";

export const TRAVELER_COLORS = [
  "bg-travel-blue/15 text-travel-blue border-travel-blue/20",
  "bg-ocean-teal/15 text-ocean-teal border-ocean-teal/20",
  "bg-golf-green/15 text-golf-green border-golf-green/20",
  "bg-weather-orange/15 text-weather-orange border-weather-orange/20",
  "bg-sun-yellow/20 text-amber-700 border-sun-yellow/30 dark:text-sun-yellow",
] as const;

export const PET_COLOR =
  "bg-warm-sand text-amber-800 border-amber-200 dark:bg-warm-sand/30 dark:text-warm-sand dark:border-amber-800/30";

export function getTravelerColor(index: number, isPet?: boolean): string {
  if (isPet) return PET_COLOR;
  return TRAVELER_COLORS[index % TRAVELER_COLORS.length];
}

export function getTravelerInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export interface AiRecommendation {
  id: string;
  type: "missing" | "weather" | "carryon" | "duplicate" | "pet" | "insight" | "warning";
  message: string;
  icon: "alert" | "cloud" | "luggage" | "paw" | "sparkles";
  severity?: "warning" | "tip";
}

export interface ReadinessStatus {
  label: string;
  message: string;
  accentClass: string;
  badgeClass: string;
}

export function getReadinessStatus(
  percentage: number,
  daysUntil: number
): ReadinessStatus {
  const expected = getExpectedProgress(daysUntil);
  const behind = percentage < expected - 10;

  if (percentage >= 75) {
    return {
      label: "Ready To Go",
      message: behind ? "Almost there — finish the last few items." : "You're in great shape for departure.",
      accentClass: "text-golf-green",
      badgeClass: "bg-golf-green/10 text-golf-green border-golf-green/20",
    };
  }
  if (percentage >= 50) {
    return {
      label: "Almost Ready",
      message: behind ? "Pick up the pace — a few categories still need attention." : "Solid progress. Keep checking items off.",
      accentClass: "text-primary",
      badgeClass: "bg-primary/10 text-primary border-primary/20",
    };
  }
  if (percentage >= 25) {
    return {
      label: "Getting Ready",
      message: behind ? "You're behind schedule for your departure date." : "Good start — focus on essentials next.",
      accentClass: "text-weather-orange",
      badgeClass: "bg-weather-orange/10 text-weather-orange border-weather-orange/20",
    };
  }
  return {
    label: "Not Started",
    message: behind && daysUntil <= 7 ? "You're behind schedule." : "Time to start packing — tackle one category at a time.",
    accentClass: "text-weather-orange",
    badgeClass: "bg-weather-orange/10 text-weather-orange border-weather-orange/20",
  };
}

function getExpectedProgress(daysUntil: number): number {
  if (daysUntil <= 0) return 100;
  if (daysUntil <= 1) return 90;
  if (daysUntil <= 3) return 75;
  if (daysUntil <= 7) return 50;
  if (daysUntil <= 14) return 30;
  return 15;
}

export function getRecommendedNextSteps(
  items: PackingItem[],
  travelers: Traveler[],
  activities: string[]
): string[] {
  const steps: string[] = [];
  const unpacked = items.filter((i) => !i.packed);

  if (
    activities.some((a) => a.toLowerCase().includes("golf")) &&
    unpacked.some(
      (i) =>
        i.activity_name?.toLowerCase().includes("golf") ||
        i.item_name.toLowerCase().includes("golf")
    )
  ) {
    steps.push("Pack golf gear");
  }

  travelers
    .filter((t) => t.traveler_type === "pet")
    .forEach((pet) => {
      if (unpacked.some((i) => i.traveler_id === pet.id)) {
        steps.push(`Pack ${pet.name}'s supplies`);
      }
    });

  if (unpacked.some((i) => i.shared)) {
    steps.push("Confirm shared items");
  }

  if (unpacked.some((i) => i.category === "toiletries")) {
    steps.push("Pack toiletries");
  }

  if (steps.length === 0 && unpacked.length > 0) {
    const top = unpacked[0];
    steps.push(`Pack ${top.item_name.toLowerCase()}`);
  }

  return steps.slice(0, 4);
}

export function generatePackingCoachAlerts(
  items: PackingItem[],
  travelers: Traveler[],
  weather: WeatherData | null,
  travelType?: string
): AiRecommendation[] {
  const alerts: AiRecommendation[] = [];
  const unpacked = items.filter((i) => !i.packed);

  travelers
    .filter((t) => t.traveler_type === "pet")
    .forEach((pet) => {
      const petUnpacked = unpacked.filter((i) => i.traveler_id === pet.id);
      const food = petUnpacked.find((i) => i.item_name.toLowerCase().includes("food"));
      if (food) {
        alerts.push({
          id: `pet-food-${pet.id}`,
          type: "pet",
          severity: "warning",
          message: `${pet.name}'s ${food.item_name.toLowerCase()} hasn't been packed`,
          icon: "paw",
        });
      } else if (petUnpacked.length > 0) {
        alerts.push({
          id: `pet-${pet.id}`,
          type: "pet",
          severity: "warning",
          message: `${petUnpacked.length} item${petUnpacked.length > 1 ? "s" : ""} for ${pet.name} still unpacked`,
          icon: "paw",
        });
      }
    });

  const golfUnpacked = unpacked.filter(
    (i) =>
      i.activity_name?.toLowerCase().includes("golf") ||
      i.item_name.toLowerCase().includes("golf")
  );
  if (golfUnpacked.length > 0) {
    alerts.push({
      id: "golf-missing",
      type: "missing",
      severity: "warning",
      message: `${golfUnpacked[0].item_name} still needs packing`,
      icon: "alert",
    });
  }

  const hotDay = weather?.daily.find((d) => d.temp_high > 90);
  if (hotDay) {
    alerts.push({
      id: "hot-weather",
      type: "weather",
      severity: "warning",
      message: `Weather may reach ${hotDay.temp_high}°F — pack sunscreen & light layers`,
      icon: "cloud",
    });
  }

  const rainyDay = weather?.daily.find((d) => d.rain_chance > 40);
  if (rainyDay) {
    const hasRainGear = items.some((i) =>
      i.item_name.toLowerCase().includes("rain")
    );
    if (!hasRainGear) {
      alerts.push({
        id: "rain",
        type: "weather",
        severity: "warning",
        message: `Rain likely (${rainyDay.rain_chance}% chance) — consider a rain jacket`,
        icon: "cloud",
      });
    }
  }

  const sharedUnpacked = unpacked.filter((i) => i.shared);
  if (sharedUnpacked.length > 0) {
    alerts.push({
      id: "shared-unpacked",
      type: "missing",
      severity: "warning",
      message: `Shared ${sharedUnpacked[0].item_name.toLowerCase()} not packed yet`,
      icon: "alert",
    });
  }

  if (
    (travelType === "carry_on" || items.length > 18) &&
    unpacked.length > items.length * 0.5
  ) {
    alerts.push({
      id: "carryon",
      type: "carryon",
      severity: "tip",
      message: "Carry-on may be too full — optimize your list",
      icon: "luggage",
    });
  }

  return alerts.slice(0, 5);
}

export function generateSmartInsights(
  items: PackingItem[],
  travelers: Traveler[],
  weather: WeatherData | null,
  travelType?: string
): AiRecommendation[] {
  const insights: AiRecommendation[] = [];

  if (travelType === "carry_on" && items.length > 15) {
    const reducible = Math.min(3, Math.floor(items.length * 0.15));
    insights.push({
      id: "reduce-carryon",
      type: "insight",
      severity: "tip",
      message: `You could reduce this list by ~${reducible} items and still fit carry-on only`,
      icon: "sparkles",
    });
  }

  const shoeItems = items.filter((i) => i.category === "shoes");
  const golfShoes = shoeItems.filter((i) => i.item_name.toLowerCase().includes("golf"));
  if (golfShoes.length >= 2) {
    insights.push({
      id: "dup-shoes",
      type: "insight",
      severity: "tip",
      message: "You have multiple golf shoes listed — consider bringing one pair",
      icon: "sparkles",
    });
  }

  const coldDay = weather?.daily.find((d) => d.temp_low < 50);
  if (coldDay && !items.some((i) => i.item_name.toLowerCase().includes("jacket"))) {
    insights.push({
      id: "cold-layer",
      type: "insight",
      severity: "tip",
      message: "Forecast suggests cool evenings — a lightweight jacket may help",
      icon: "cloud",
    });
  }

  const duplicateTops = items.filter(
    (i) =>
      i.category === "clothing" &&
      (i.item_name.toLowerCase().includes("shirt") ||
        i.item_name.toLowerCase().includes("polo"))
  );
  if (duplicateTops.length > 6) {
    insights.push({
      id: "many-tops",
      type: "insight",
      severity: "tip",
      message: "Lots of tops packed — laundry access may let you pack lighter",
      icon: "sparkles",
    });
  }

  return insights.slice(0, 3);
}

export function generateAiRecommendations(
  items: PackingItem[],
  travelers: Traveler[],
  weather: WeatherData | null
): AiRecommendation[] {
  return [
    ...generatePackingCoachAlerts(items, travelers, weather),
    ...generateSmartInsights(items, travelers, weather),
  ].slice(0, 4);
}

export interface TimelineMilestone {
  daysBefore: number;
  label: string;
  tasks: string[];
  active: boolean;
  completed: boolean;
}

export function generatePackingTimeline(daysUntilDeparture: number): TimelineMilestone[] {
  const milestones = [
    {
      daysBefore: 14,
      label: "14 Days Before",
      tasks: ["Order missing items", "Review activity gear needs"],
    },
    {
      daysBefore: 7,
      label: "7 Days Before",
      tasks: ["Check weather forecast", "Confirm shared items"],
    },
    {
      daysBefore: 3,
      label: "3 Days Before",
      tasks: ["Start packing clothes", "Charge electronics"],
    },
    {
      daysBefore: 1,
      label: "Night Before",
      tasks: ["Pack toiletries", "Finalize handbag/backpack"],
    },
    {
      daysBefore: 0,
      label: "Travel Day",
      tasks: ["Passport & ID", "Wallet", "Phone charger", "Boarding passes"],
    },
  ];

  return milestones.map((m) => ({
    ...m,
    active:
      daysUntilDeparture <= m.daysBefore &&
      daysUntilDeparture > Math.max(0, m.daysBefore - 3),
    completed: daysUntilDeparture < m.daysBefore,
  }));
}

export function getCountdownLabel(days: number): string {
  if (days < 0) return "Past trip";
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days} days left`;
  return `${days} days until departure`;
}

export function getCountdownUrgency(days: number): "urgent" | "soon" | "relaxed" {
  if (days <= 1) return "urgent";
  if (days <= 7) return "soon";
  return "relaxed";
}

export function getWeatherSnapshot(weather: WeatherData | null) {
  if (!weather?.daily?.length) return null;

  const avgHigh = Math.round(
    weather.daily.reduce((s, d) => s + d.temp_high, 0) / weather.daily.length
  );
  const avgLow = Math.round(
    weather.daily.reduce((s, d) => s + d.temp_low, 0) / weather.daily.length
  );
  const maxRain = Math.max(...weather.daily.map((d) => d.rain_chance));
  const dominant = weather.daily[0]?.conditions ?? "Mixed";

  let suggestion = "Layer-friendly clothing";
  if (avgHigh > 85) suggestion = "Lightweight clothing & sunscreen";
  else if (avgLow < 45) suggestion = "Warm layers for cool mornings";
  else if (maxRain > 40) suggestion = "Rain layer recommended";

  return {
    location: weather.location,
    avgHigh,
    avgLow,
    conditions: dominant,
    rainChance: maxRain,
    suggestion,
  };
}
