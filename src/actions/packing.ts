"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/supabase/client";
import {
  addDemoChatMessage,
  applyDemoItemUpdates,
  getDemoChatMessages,
  toggleDemoItemPacked,
  updateDemoItemNotes,
} from "@/lib/demo/store";
import { refineWithChat } from "@/lib/ai/chat-refinement";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getTripDetails } from "./trips";

export async function toggleItemPacked(tripId: string, itemId: string, packed: boolean) {
  if (isDemoMode()) {
    toggleDemoItemPacked(itemId, packed);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("packing_items")
    .update({ packed, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("trip_id", tripId);
}

export async function updateItemNotes(tripId: string, itemId: string, notes: string) {
  if (isDemoMode()) {
    updateDemoItemNotes(itemId, notes);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("packing_items")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("trip_id", tripId);
}

export async function sendChatMessage(tripId: string, message: string) {
  const user = await getCurrentUser();
  const trip = await getTripDetails(tripId);
  if (!trip) throw new Error("Trip not found");

  if (isDemoMode()) {
    addDemoChatMessage(tripId, user?.id ?? null, "user", message);

    const result = await refineWithChat(message, {
      destination: trip.destination,
      packing_mode: trip.packing_mode,
      travel_type: trip.travel_type,
      items: trip.packing_items.map((i) => ({
        item_name: i.item_name,
        quantity: i.quantity,
        category: i.category,
        shared: i.shared,
      })),
      travelers: trip.travelers.map((t) => ({ name: t.name })),
    });

    applyDemoItemUpdates(tripId, result.item_updates);
    addDemoChatMessage(tripId, null, "assistant", result.message);
    revalidatePath(`/trips/${tripId}`);
    return { message: result.message };
  }

  const supabase = await createClient();

  await supabase.from("chat_messages").insert({
    trip_id: tripId,
    user_id: user?.id,
    role: "user",
    content: message,
  });

  const result = await refineWithChat(message, {
    destination: trip.destination,
    packing_mode: trip.packing_mode,
    travel_type: trip.travel_type,
    items: trip.packing_items.map((i) => ({
      item_name: i.item_name,
      quantity: i.quantity,
      category: i.category,
      shared: i.shared,
    })),
    travelers: trip.travelers.map((t) => ({ name: t.name })),
  });

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
    } else if (update.action === "add") {
      const traveler = trip.travelers.find((t) => t.name === update.traveler_name);
      await supabase.from("packing_items").insert({
        trip_id: tripId,
        item_name: update.item_name,
        quantity: update.quantity ?? 1,
        category: update.category ?? "miscellaneous",
        shared: update.shared ?? false,
        traveler_id: update.shared ? null : traveler?.id ?? null,
        packed: false,
      });
    }
  }

  await supabase.from("chat_messages").insert({
    trip_id: tripId,
    role: "assistant",
    content: result.message,
  });

  revalidatePath(`/trips/${tripId}`);
  return { message: result.message };
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
