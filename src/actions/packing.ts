"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/supabase/client";
import {
  addDemoChatMessage,
  addDemoPackingItem,
  applyDemoItemUpdates,
  getDemoChatMessages,
  removeDemoPackingItem,
  toggleDemoItemPacked,
  updateDemoItemNotes,
} from "@/lib/demo/store";
import { refineWithChat } from "@/lib/ai/chat-refinement";
import { createClient } from "@/lib/supabase/server";
import type { PackingCategory } from "@/lib/types";
import { getCurrentUser, getTripDetails } from "./trips";

export type { PackingItemSuggestion } from "@/lib/ai/chat-refinement";

export async function toggleItemPacked(tripId: string, itemId: string, packed: boolean) {
  if (isDemoMode()) {
    toggleDemoItemPacked(itemId, packed);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("packing_items")
    .update({ packed, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
}

export async function updateItemNotes(tripId: string, itemId: string, notes: string) {
  if (isDemoMode()) {
    updateDemoItemNotes(itemId, notes);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("packing_items")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
}

export async function addPackingItem(
  tripId: string,
  itemName: string,
  travelerId: string | null,
  options?: { quantity?: number; category?: PackingCategory }
) {
  const name = itemName.trim();
  if (!name) throw new Error("Item name is required");

  if (isDemoMode()) {
    addDemoPackingItem(tripId, name, travelerId, options);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("packing_items")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId);

  const { error } = await supabase.from("packing_items").insert({
    trip_id: tripId,
    item_name: name,
    quantity: options?.quantity ?? 1,
    category: options?.category ?? "miscellaneous",
    shared: travelerId === null,
    traveler_id: travelerId,
    packed: false,
    sort_order: count ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
}

export async function addSuggestedPackingItem(
  tripId: string,
  suggestion: {
    item_name: string;
    quantity: number;
    category: PackingCategory;
    shared: boolean;
    traveler_name: string | null;
  }
) {
  const trip = await getTripDetails(tripId);
  if (!trip) throw new Error("Trip not found");

  const travelerId = suggestion.shared
    ? null
    : trip.travelers.find((t) => t.name === suggestion.traveler_name)?.id ?? null;

  await addPackingItem(tripId, suggestion.item_name, travelerId, {
    quantity: suggestion.quantity,
    category: suggestion.category,
  });
}

export async function removePackingItem(tripId: string, itemId: string) {
  if (isDemoMode()) {
    removeDemoPackingItem(itemId);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("packing_items")
    .delete()
    .eq("id", itemId)
    .eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
}

export async function sendChatMessage(tripId: string, message: string) {
  const user = await getCurrentUser();
  const trip = await getTripDetails(tripId);
  if (!trip) throw new Error("Trip not found");

  const priorHistory = (await getChatHistory(tripId))
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-8)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const tripContext = {
    destination: trip.destination,
    packing_mode: trip.packing_mode,
    travel_type: trip.travel_type,
    items: trip.packing_items.map((i) => ({
      item_name: i.item_name,
      quantity: i.quantity,
      category: i.category,
      shared: i.shared,
    })),
    travelers: trip.travelers.map((t) => ({
      name: t.name,
      type: t.traveler_type,
      pet_species: t.pet_species,
      pet_size: t.pet_size,
    })),
  };

  if (isDemoMode()) {
    addDemoChatMessage(tripId, user?.id ?? null, "user", message);

    const result = await refineWithChat(message, tripContext, priorHistory);

    applyDemoItemUpdates(tripId, result.item_updates);
    addDemoChatMessage(tripId, null, "assistant", result.message);
    revalidatePath(`/trips/${tripId}`);
    return { message: result.message, suggestions: result.suggestions };
  }

  const supabase = await createClient();

  await supabase.from("chat_messages").insert({
    trip_id: tripId,
    user_id: user?.id,
    role: "user",
    content: message,
  });

  const result = await refineWithChat(message, tripContext, priorHistory);

  for (const update of result.item_updates) {
    if (update.action === "remove") {
      await supabase
        .from("packing_items")
        .delete()
        .eq("trip_id", tripId)
        .eq("item_name", update.item_name);
    } else if (update.action === "update") {
      await supabase
        .from("packing_items")
        .update({ quantity: update.quantity })
        .eq("trip_id", tripId)
        .eq("item_name", update.item_name);
    }
  }

  await supabase.from("chat_messages").insert({
    trip_id: tripId,
    role: "assistant",
    content: result.message,
  });

  revalidatePath(`/trips/${tripId}`);
  return { message: result.message, suggestions: result.suggestions };
}

export async function getChatHistory(tripId: string) {
  if (isDemoMode()) {
    return getDemoChatMessages(tripId);
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at");
  return data ?? [];
}

export async function inviteByEmail(tripId: string, email: string, role: "editor" | "viewer") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  if (isDemoMode()) {
    return { success: true, message: `Invite sent to ${email}` };
  }

  const supabase = await createClient();
  await supabase.from("trip_invites").insert({
    trip_id: tripId,
    email,
    role,
    invited_by: user.id,
  });

  return { success: true, message: `Invite sent to ${email}` };
}

export async function getShareLink(tripId: string) {
  const trip = await getTripDetails(tripId);
  if (!trip) throw new Error("Trip not found");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${baseUrl}/trips/join/${trip.share_token}`;
}
