"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/supabase/client";
import {
  addDemoGroupMember,
  deleteDemoGroupMember,
  getDemoGroupMembers,
  updateDemoGroupMember,
} from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import type { GroupMember, OnboardingTraveler, PetSize, PetSpecies, TravelerType } from "@/lib/types";
import { getCurrentUser } from "./trips";

export async function getUserGroupMembers(): Promise<GroupMember[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  if (isDemoMode()) {
    return getDemoGroupMembers(user.id);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as GroupMember[];
}

export async function saveToMyGroup(input: {
  name: string;
  traveler_type: TravelerType;
  pet_species?: PetSpecies | null;
  pet_size?: PetSize | null;
}): Promise<{ member: GroupMember; alreadyExists: boolean }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  const pet_species = input.traveler_type === "pet" ? (input.pet_species ?? "dog") : null;
  const pet_size = input.traveler_type === "pet" ? (input.pet_size ?? "medium") : null;

  if (isDemoMode()) {
    const result = addDemoGroupMember(user.id, {
      name,
      traveler_type: input.traveler_type,
      pet_species,
      pet_size,
    });
    revalidatePath("/group");
    revalidatePath("/trips/new");
    return result;
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("group_members")
    .select("*")
    .eq("user_id", user.id)
    .ilike("name", name)
    .eq("traveler_type", input.traveler_type)
    .maybeSingle();

  if (existing) {
    return { member: existing as GroupMember, alreadyExists: true };
  }

  const { data, error } = await supabase
    .from("group_members")
    .insert({
      user_id: user.id,
      name,
      traveler_type: input.traveler_type,
      pet_species,
      pet_size,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/group");
  revalidatePath("/trips/new");
  return { member: data as GroupMember, alreadyExists: false };
}

export async function syncTravelersToMyGroup(travelers: OnboardingTraveler[]) {
  const user = await getCurrentUser();
  if (!user) return;

  for (const t of travelers) {
    if (!t.name.trim()) continue;
    await saveToMyGroup({
      name: t.name,
      traveler_type: t.traveler_type,
      pet_species: t.pet_species,
      pet_size: t.pet_size,
    });
  }
}

export async function updateMyGroupMember(
  memberId: string,
  updates: {
    name?: string;
    traveler_type?: TravelerType;
    pet_species?: PetSpecies | null;
    pet_size?: PetSize | null;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  if (isDemoMode()) {
    updateDemoGroupMember(user.id, memberId, updates);
    revalidatePath("/group");
    revalidatePath("/trips/new");
    return;
  }

  const supabase = await createClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.traveler_type !== undefined) payload.traveler_type = updates.traveler_type;
  if (updates.pet_species !== undefined) payload.pet_species = updates.pet_species;
  if (updates.pet_size !== undefined) payload.pet_size = updates.pet_size;

  const { error } = await supabase
    .from("group_members")
    .update(payload)
    .eq("id", memberId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/group");
  revalidatePath("/trips/new");
}

export async function deleteMyGroupMember(memberId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  if (isDemoMode()) {
    deleteDemoGroupMember(user.id, memberId);
    revalidatePath("/group");
    revalidatePath("/trips/new");
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("id", memberId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/group");
  revalidatePath("/trips/new");
}
