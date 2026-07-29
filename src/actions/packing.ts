"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/supabase/client";
import {
  addDemoChatMessage,
  addDemoPackingItem,
  applyDemoItemUpdates,
  createDemoOutfit,
  deleteDemoOutfit,
  getDemoChatMessages,
  removeDemoPackingItem,
  toggleDemoItemPacked,
  updateDemoCalendarDayNotes,
  updateDemoCalendarDayTitle,
  updateDemoCalendarDayActivities,
  updateDemoItemNotes,
  updateDemoOutfit,
  upsertDemoCalendarDay,
} from "@/lib/demo/store";
import { refineWithChat } from "@/lib/ai/chat-refinement";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/app-url";
import { sendTripInviteEmail } from "@/lib/email/send-invite";
import {
  inviteShareDescription,
  inviteShareMessage,
  inviteShareTitle,
} from "@/lib/invite-share";
import type { ChatMessage, Outfit, OutfitItem, PackingCategory } from "@/lib/types";
import { serializeOutfitItems } from "@/lib/outfit-items";
import {
  defaultHumanTraveler,
  packingItemHasGear,
  planGearChecklistPlacement,
} from "@/lib/packing/sync-gear-to-checklist";
import { analyzePackingGaps, formatGapsForAi } from "@/lib/packing/gap-analysis";
import { getUserGearItems } from "@/actions/gear";
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

export async function updateCalendarDayNotes(
  tripId: string,
  dayId: string,
  notes: string,
  tripDate?: string
) {
  if (isDemoMode()) {
    if (dayId && !/^\d{4}-\d{2}-\d{2}$/.test(dayId)) {
      updateDemoCalendarDayNotes(dayId, notes);
    } else if (tripDate) {
      upsertDemoCalendarDay(tripId, tripDate, { notes });
    }
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  const trimmed = notes.trim() || null;

  if (dayId && !/^\d{4}-\d{2}-\d{2}$/.test(dayId)) {
    const { error } = await supabase
      .from("calendar_days")
      .update({ notes: trimmed })
      .eq("id", dayId)
      .eq("trip_id", tripId);
    if (error) throw new Error(error.message);
  } else if (tripDate) {
    const { data: existing } = await supabase
      .from("calendar_days")
      .select("id, title")
      .eq("trip_id", tripId)
      .eq("trip_date", tripDate)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("calendar_days")
        .update({ notes: trimmed })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("calendar_days").insert({
        trip_id: tripId,
        trip_date: tripDate,
        title: "On the trip",
        activities: [],
        notes: trimmed,
      });
      if (error) throw new Error(error.message);
    }
  }

  revalidatePath(`/trips/${tripId}`);
}

export async function saveCalendarDayTitle(
  tripId: string,
  tripDate: string,
  title: string,
  dayId?: string
) {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Day title is required");

  if (isDemoMode()) {
    if (dayId && !/^\d{4}-\d{2}-\d{2}$/.test(dayId)) {
      updateDemoCalendarDayTitle(dayId, trimmed);
    } else {
      upsertDemoCalendarDay(tripId, tripDate, { title: trimmed });
    }
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();

  if (dayId && !/^\d{4}-\d{2}-\d{2}$/.test(dayId)) {
    const { error } = await supabase
      .from("calendar_days")
      .update({ title: trimmed })
      .eq("id", dayId)
      .eq("trip_id", tripId);
    if (error) throw new Error(error.message);
  } else {
    const { data: existing } = await supabase
      .from("calendar_days")
      .select("id")
      .eq("trip_id", tripId)
      .eq("trip_date", tripDate)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("calendar_days")
        .update({ title: trimmed })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("calendar_days").insert({
        trip_id: tripId,
        trip_date: tripDate,
        title: trimmed,
        activities: [],
      });
      if (error) throw new Error(error.message);
    }
  }

  revalidatePath(`/trips/${tripId}`);
}

export async function saveCalendarDayActivities(
  tripId: string,
  tripDate: string,
  activities: string[],
  dayId?: string
) {
  const cleaned = [...new Set(activities.map((a) => a.trim()).filter(Boolean))];

  if (isDemoMode()) {
    if (dayId && !/^\d{4}-\d{2}-\d{2}$/.test(dayId)) {
      updateDemoCalendarDayActivities(dayId, cleaned);
    } else {
      upsertDemoCalendarDay(tripId, tripDate, { activities: cleaned });
    }
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();

  if (dayId && !/^\d{4}-\d{2}-\d{2}$/.test(dayId)) {
    const { error } = await supabase
      .from("calendar_days")
      .update({ activities: cleaned })
      .eq("id", dayId)
      .eq("trip_id", tripId);
    if (error) throw new Error(error.message);
  } else {
    const { data: existing } = await supabase
      .from("calendar_days")
      .select("id, title")
      .eq("trip_id", tripId)
      .eq("trip_date", tripDate)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("calendar_days")
        .update({ activities: cleaned })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("calendar_days").insert({
        trip_id: tripId,
        trip_date: tripDate,
        title: "On the trip",
        activities: cleaned,
      });
      if (error) throw new Error(error.message);
    }
  }

  revalidatePath(`/trips/${tripId}`);
}

export async function createOutfit(
  tripId: string,
  input: {
    trip_date: string;
    time_of_day?: Outfit["time_of_day"];
    title?: string;
    description?: string;
    activity_name?: string | null;
    items?: string[];
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  if (isDemoMode()) {
    createDemoOutfit(tripId, { ...input, user_id: user.id });
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("outfits").insert({
    trip_id: tripId,
    user_id: user.id,
    trip_date: input.trip_date,
    time_of_day: input.time_of_day ?? "all_day",
    title: input.title?.trim() || "New event",
    description: input.description?.trim() || "",
    activity_name: input.activity_name ?? null,
    items: input.items ?? [],
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
}

export async function updateOutfit(
  tripId: string,
  outfitId: string,
  updates: Partial<
    Pick<Outfit, "title" | "description" | "time_of_day" | "activity_name" | "items">
  >
) {
  const normalized = {
    ...updates,
    items: updates.items !== undefined ? serializeOutfitItems(updates.items) : undefined,
  };

  if (isDemoMode()) {
    updateDemoOutfit(outfitId, normalized);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const payload: Record<string, unknown> = {};
  if (normalized.title !== undefined) payload.title = normalized.title.trim() || "Event";
  if (normalized.description !== undefined) payload.description = normalized.description.trim();
  if (normalized.time_of_day !== undefined) payload.time_of_day = normalized.time_of_day;
  if (normalized.activity_name !== undefined) payload.activity_name = normalized.activity_name;
  if (normalized.items !== undefined) payload.items = normalized.items;

  const supabase = await createClient();
  const { error } = await supabase
    .from("outfits")
    .update(payload)
    .eq("id", outfitId)
    .eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
}

export async function deleteOutfit(tripId: string, outfitId: string) {
  if (isDemoMode()) {
    deleteDemoOutfit(outfitId);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("outfits")
    .delete()
    .eq("id", outfitId)
    .eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
}

export async function syncGearToChecklist(
  tripId: string,
  gear: {
    id: string;
    item_name: string;
    category: PackingCategory;
    subcategory?: string | null;
  },
  options?: { activity_name?: string | null; traveler_id?: string | null }
): Promise<{ added: boolean }> {
  const trip = await getTripDetails(tripId);
  if (!trip) throw new Error("Trip not found");

  if (packingItemHasGear(trip.packing_items, gear.id)) {
    return { added: false };
  }

  const traveler =
    options?.traveler_id !== undefined
      ? trip.travelers.find((t) => t.id === options.traveler_id) ?? null
      : defaultHumanTraveler(trip.travelers);

  const travelerId = traveler?.id ?? null;
  const { parent_item_id } = planGearChecklistPlacement(trip.packing_items, gear);

  await addPackingItem(tripId, gear.item_name, travelerId, {
    category: gear.category,
    gear_item_id: gear.id,
    parent_item_id,
    shared: travelerId === null,
    activity_name: options?.activity_name ?? null,
  });

  return { added: true };
}

export async function addPackingItem(
  tripId: string,
  itemName: string,
  travelerId: string | null,
  options?: {
    quantity?: number;
    category?: PackingCategory;
    parent_item_id?: string | null;
    gear_item_id?: string | null;
    shared?: boolean;
    activity_name?: string | null;
  }
) {
  const name = itemName.trim();
  if (!name) throw new Error("Item name is required");

  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const isChild = !!options?.parent_item_id;
  const shared = options?.shared ?? travelerId === null;

  if (isDemoMode()) {
    addDemoPackingItem(tripId, name, travelerId, { ...options, user_id: user.id });
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
    quantity: isChild ? 1 : (options?.quantity ?? 1),
    category: options?.category ?? "miscellaneous",
    shared,
    traveler_id: travelerId,
    parent_item_id: options?.parent_item_id ?? null,
    gear_item_id: options?.gear_item_id ?? null,
    user_id: user.id,
    activity_name: options?.activity_name ?? null,
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

export async function resolvePackingGap(
  tripId: string,
  fix: import("@/lib/packing/gap-analysis").PackingGapFix
) {
  if (fix.type === "add_gear" && fix.gear_item_id) {
    const gearItems = await getUserGearItems();
    const gear = gearItems.find((g) => g.id === fix.gear_item_id);
    if (!gear) throw new Error("Gear item not found");
    await syncGearToChecklist(tripId, gear, { activity_name: fix.activity_name });
    return;
  }

  const trip = await getTripDetails(tripId);
  if (!trip) throw new Error("Trip not found");
  const traveler = defaultHumanTraveler(trip.travelers);

  await addPackingItem(tripId, fix.item_name, traveler?.id ?? null, {
    category: fix.category,
    activity_name: fix.activity_name ?? null,
  });
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

  const gearItems = await getUserGearItems();
  const packingGaps = analyzePackingGaps(trip, gearItems);

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
    packing_gaps: formatGapsForAi(packingGaps),
  };

  if (isDemoMode()) {
    addDemoChatMessage(tripId, user?.id ?? null, "user", message, "ai");

    const result = await refineWithChat(message, tripContext, priorHistory);

    applyDemoItemUpdates(tripId, result.item_updates);
    addDemoChatMessage(tripId, null, "assistant", result.message, "ai");
    revalidatePath(`/trips/${tripId}`);
    return { message: result.message, suggestions: result.suggestions };
  }

  const supabase = await createClient();

  await supabase.from("chat_messages").insert({
    trip_id: tripId,
    user_id: user?.id,
    role: "user",
    content: message,
    channel: "ai",
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
    channel: "ai",
  });

  revalidatePath(`/trips/${tripId}`);
  return { message: result.message, suggestions: result.suggestions };
}

export async function getChatHistory(tripId: string) {
  if (isDemoMode()) {
    return getDemoChatMessages(tripId, "ai");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("trip_id", tripId)
    .eq("channel", "ai")
    .order("created_at");
  return data ?? [];
}

export async function getGroupChatHistory(tripId: string) {
  if (isDemoMode()) {
    return getDemoChatMessages(tripId, "group");
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("*, profile:profiles(*)")
    .eq("trip_id", tripId)
    .eq("channel", "group")
    .order("created_at");
  return (data ?? []) as ChatMessage[];
}

export async function sendGroupChatMessage(tripId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message is required");

  if (isDemoMode()) {
    const msg = addDemoChatMessage(tripId, user.id, "user", trimmed, "group");
    revalidatePath(`/trips/${tripId}`);
    return msg;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      trip_id: tripId,
      user_id: user.id,
      role: "user",
      content: trimmed,
      channel: "group",
    })
    .select("*, profile:profiles(*)")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
  return data as ChatMessage;
}

export async function inviteByEmail(tripId: string, email: string, role: "editor" | "viewer") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) throw new Error("Enter a valid email address");

  if (isDemoMode()) {
    return {
      success: true,
      message: `Demo invite recorded for ${trimmed}. Share the link to collaborate.`,
      emailed: false,
    };
  }

  const supabase = await createClient();
  const trip = await getTripDetails(tripId);
  if (!trip) throw new Error("Trip not found");
  if (trip.owner_id !== user.id) throw new Error("Only the trip owner can send invites");

  const { error } = await supabase.from("trip_invites").upsert(
    {
      trip_id: tripId,
      email: trimmed,
      role,
      invited_by: user.id,
      accepted_at: null,
    },
    { onConflict: "trip_id,email" }
  );
  if (error) throw new Error(error.message);

  const shareLink = `${getAppUrl()}/trips/join/${trip.share_token}`;
  const inviterName = user.name?.split(" ")[0] || "A traveler";
  const emailed = await sendTripInviteEmail({
    to: trimmed,
    destination: trip.destination,
    inviterName,
    role,
    shareLink,
    startDate: trip.start_date,
    endDate: trip.end_date,
    coverImageUrl: trip.cover_image_url ?? null,
  });

  return {
    success: true,
    emailed: emailed.sent,
    message: emailed.sent
      ? `Invite emailed to ${trimmed}`
      : `Invite saved for ${trimmed}. Copy or text the share link below.`,
  };
}

export async function getShareInvite(tripId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const trip = await getTripDetails(tripId);
  if (!trip) throw new Error("Trip not found");

  const inviterName = user.name?.split(" ")[0] || "A traveler";
  const shareLink = `${getAppUrl()}/trips/join/${trip.share_token}`;

  return {
    shareLink,
    inviterName,
    destination: trip.destination,
    startDate: trip.start_date,
    endDate: trip.end_date,
    coverImageUrl: trip.cover_image_url ?? null,
    title: inviteShareTitle({ inviterName, destination: trip.destination }),
    text: inviteShareDescription({
      inviterName,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
    }),
    message: inviteShareMessage({
      inviterName,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      shareLink,
    }),
  };
}

/** @deprecated Prefer getShareInvite for share text + link */
export async function getShareLink(tripId: string) {
  const invite = await getShareInvite(tripId);
  return invite.shareLink;
}
