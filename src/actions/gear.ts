"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/supabase/client";
import {
  addDemoGearItem,
  deleteDemoGearItem,
  getDemoGearItems,
  updateDemoGearItem,
} from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import type { GearItem, PackingCategory } from "@/lib/types";
import { getCurrentUser } from "./trips";

export async function getUserGearItems(): Promise<GearItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  if (isDemoMode()) {
    return getDemoGearItems(user.id);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gear_items")
    .select("*")
    .eq("user_id", user.id)
    .order("item_name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as GearItem[];
}

export async function saveToMyGear(input: {
  item_name: string;
  category: PackingCategory;
  description?: string | null;
}): Promise<{ item: GearItem | null; alreadyExists: boolean }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const item_name = input.item_name.trim();
  if (!item_name) throw new Error("Item name is required");

  if (isDemoMode()) {
    const result = addDemoGearItem(user.id, {
      item_name,
      category: input.category,
      description: input.description?.trim() || null,
    });
    revalidatePath("/dashboard");
    revalidatePath("/gear");
    return result;
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("gear_items")
    .select("id")
    .eq("user_id", user.id)
    .ilike("item_name", item_name)
    .maybeSingle();

  if (existing) {
    return { item: null, alreadyExists: true };
  }

  const { data, error } = await supabase
    .from("gear_items")
    .insert({
      user_id: user.id,
      item_name,
      category: input.category,
      description: input.description?.trim() || null,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save item");
  revalidatePath("/dashboard");
  revalidatePath("/gear");
  return { item: data as GearItem, alreadyExists: false };
}

export async function updateMyGearItem(
  itemId: string,
  updates: {
    item_name?: string;
    description?: string | null;
    category?: PackingCategory;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const item_name = updates.item_name?.trim();

  if (isDemoMode()) {
    updateDemoGearItem(user.id, itemId, {
      ...(item_name ? { item_name } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.category ? { category: updates.category } : {}),
    });
    revalidatePath("/dashboard");
    revalidatePath("/gear");
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("gear_items")
    .update({
      ...(item_name ? { item_name } : {}),
      ...(updates.description !== undefined
        ? { description: updates.description?.trim() || null }
        : {}),
      ...(updates.category ? { category: updates.category } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/gear");
}

export async function deleteMyGearItem(itemId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  if (isDemoMode()) {
    deleteDemoGearItem(user.id, itemId);
    revalidatePath("/dashboard");
    revalidatePath("/gear");
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("gear_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/gear");
}
