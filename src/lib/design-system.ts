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
  type: "missing" | "weather" | "carryon" | "duplicate" | "pet";
  message: string;
  icon: "alert" | "cloud" | "luggage" | "paw" | "sparkles";
}

export function generateAiRecommendations(
  items: PackingItem[],
  travelers: Traveler[],
  weather: WeatherData | null
): AiRecommendation[] {
  const recs: AiRecommendation[] = [];
  const unpacked = items.filter((i) => !i.packed);

  const golfBalls = items.find(
    (i) => i.item_name.toLowerCase().includes("golf ball") && !i.packed
  );
  if (golfBalls || items.some((i) => i.activity_name === "Golf" && !i.packed && i.item_name.includes("Golf"))) {
    const missingGolf = items.filter(
      (i) => i.activity_name === "Golf" && !i.packed
    );
    if (missingGolf.length > 0) {
      recs.push({
        id: "golf",
        type: "missing",
        message: `You haven't packed ${missingGolf[0].item_name.toLowerCase()} yet.`,
        icon: "alert",
      });
    }
  }

  const rainyDay = weather?.daily.find((d) => d.rain_chance > 40);
  if (rainyDay) {
    recs.push({
      id: "rain",
      type: "weather",
      message: `${rainyDay.date.slice(5).replace("-", "/")} may have rain — pack a light jacket.`,
      icon: "cloud",
    });
  }

  const hotDay = weather?.daily.find((d) => d.temp_high > 95);
  if (hotDay) {
    recs.push({
      id: "hot",
      type: "weather",
      message: `Looks like ${hotDay.temp_high}°F during your stay. Sunscreen and light layers added.`,
      icon: "cloud",
    });
  }

  const pets = travelers.filter((t) => t.traveler_type === "pet");
  pets.forEach((pet) => {
    const petItems = items.filter((i) => i.traveler_id === pet.id && !i.packed);
    if (petItems.length > 0) {
      recs.push({
        id: `pet-${pet.id}`,
        type: "pet",
        message: `${pet.name}'s ${petItems[0].item_name.toLowerCase()} hasn't been packed yet.`,
        icon: "paw",
      });
    }
  });

  const sharedCount = items.filter((i) => i.shared).length;
  if (sharedCount >= 3) {
    recs.push({
      id: "shared",
      type: "duplicate",
      message: `Saved ${sharedCount} duplicate items by sharing essentials.`,
      icon: "sparkles",
    });
  }

  if (unpacked.length > items.length * 0.6 && items.length > 10) {
    recs.push({
      id: "carryon",
      type: "carryon",
      message: "Your carry-on may be tight. Ask AI to optimize your list.",
      icon: "luggage",
    });
  }

  return recs.slice(0, 4);
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
    { daysBefore: 14, label: "14 Days Before", tasks: ["Order missing items", "Review activity gear needs"] },
    { daysBefore: 7, label: "7 Days Before", tasks: ["Check weather forecast", "Confirm shared items with travel partners"] },
    { daysBefore: 3, label: "3 Days Before", tasks: ["Begin packing clothing", "Charge electronics"] },
    { daysBefore: 1, label: "Night Before", tasks: ["Pack toiletries", "Set out travel day essentials"] },
    { daysBefore: 0, label: "Travel Day", tasks: ["Passport & ID", "Wallet", "Phone & charger", "Boarding passes"] },
  ];

  return milestones.map((m) => ({
    ...m,
    active: daysUntilDeparture <= m.daysBefore && daysUntilDeparture > Math.max(0, m.daysBefore - 3),
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
