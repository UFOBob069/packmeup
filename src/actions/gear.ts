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
import { inferColorFromName } from "@/lib/gear/infer-color";
import { inferSubcategory } from "@/lib/gear/subcategory";
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
  color?: string | null;
  subcategory?: string | null;
  parent_item_name?: string | null;
}): Promise<{ item: GearItem; alreadyExists: boolean }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const item_name = input.item_name.trim();
  if (!item_name) throw new Error("Item name is required");

  const color = input.color?.trim() || inferColorFromName(item_name);
  const subcategory =
    input.subcategory?.trim() ||
    inferSubcategory(item_name, input.category) ||
    (input.parent_item_name
      ? inferSubcategory(input.parent_item_name, input.category)
      : null);

  if (isDemoMode()) {
    const result = addDemoGearItem(user.id, {
      item_name,
      category: input.category,
      description: input.description?.trim() || null,
      color,
      subcategory,
    });
    revalidatePath("/dashboard");
    revalidatePath("/gear");
    if (!result.item) throw new Error("Failed to save gear item");
    return { item: result.item, alreadyExists: result.alreadyExists };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("gear_items")
    .select("*")
    .eq("user_id", user.id)
    .ilike("item_name", item_name)
    .maybeSingle();

  if (existing) {
    return { item: existing as GearItem, alreadyExists: true };
  }

  const { data, error } = await supabase
    .from("gear_items")
    .insert({
      user_id: user.id,
      item_name,
      category: input.category,
      description: input.description?.trim() || null,
      color,
      subcategory,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save item");
  revalidatePath("/dashboard");
  revalidatePath("/gear");
  return { item: data as GearItem, alreadyExists: false };
}

export async function getOrCreateGearItem(input: {
  item_name: string;
  category: PackingCategory;
  parent_item_name?: string | null;
}): Promise<GearItem> {
  const { item } = await saveToMyGear({
    item_name: input.item_name,
    category: input.category,
    parent_item_name: input.parent_item_name,
  });
  return item;
}

export async function updateMyGearItem(
  itemId: string,
  updates: {
    item_name?: string;
    description?: string | null;
    subcategory?: string | null;
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
      ...(updates.subcategory !== undefined ? { subcategory: updates.subcategory } : {}),
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
      ...(updates.subcategory !== undefined
        ? { subcategory: updates.subcategory?.trim() || null }
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
