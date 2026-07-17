import type { GroupMember, OnboardingTraveler } from "@/lib/types";

export function travelerKey(t: Pick<OnboardingTraveler, "name" | "traveler_type">): string {
  return `${t.name.trim().toLowerCase()}|${t.traveler_type}`;
}

export function groupMemberToTraveler(member: GroupMember): OnboardingTraveler {
  return {
    name: member.name,
    traveler_type: member.traveler_type,
    ...(member.traveler_type === "pet"
      ? {
          pet_species: member.pet_species ?? "dog",
          pet_size: member.pet_size ?? "medium",
        }
      : {}),
  };
}

export function isTravelerInList(
  traveler: OnboardingTraveler,
  list: OnboardingTraveler[]
): boolean {
  const key = travelerKey(traveler);
  return list.some((t) => travelerKey(t) === key);
}
