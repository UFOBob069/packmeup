"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/supabase/client";
import {
  addDemoWorkspaceItem,
  deleteDemoWorkspaceItem,
  toggleDemoWorkspaceItem,
  updateDemoWorkspaceItem,
} from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import type { TripWorkspaceItem } from "@/lib/types";

type WorkspaceKind = TripWorkspaceItem["kind"];

export async function addTripWorkspaceItem(
  tripId: string,
  kind: WorkspaceKind,
  title: string,
  details?: string
) {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("A title is required");

  if (isDemoMode()) {
    addDemoWorkspaceItem(tripId, kind, trimmed, details);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("trip_workspace_items")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId)
    .eq("kind", kind);
  const { error } = await supabase.from("trip_workspace_items").insert({
    trip_id: tripId,
    kind,
    title: trimmed,
    details: details?.trim() || null,
    sort_order: count ?? 0,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
}

export async function updateTripWorkspaceItem(
  tripId: string,
  itemId: string,
  updates: { title?: string; details?: string | null }
) {
  if (updates.title !== undefined && !updates.title.trim()) {
    throw new Error("A title is required");
  }

  if (isDemoMode()) {
    updateDemoWorkspaceItem(tripId, itemId, updates);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const payload: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.details !== undefined) {
    payload.details = updates.details?.trim() || null;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_workspace_items")
    .update(payload)
    .eq("id", itemId)
    .eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
}

export async function toggleTripWorkspaceItem(
  tripId: string,
  itemId: string,
  completed: boolean
) {
  if (isDemoMode()) {
    toggleDemoWorkspaceItem(itemId, completed);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_workspace_items")
    .update({ completed, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
}

export async function deleteTripWorkspaceItem(tripId: string, itemId: string) {
  if (isDemoMode()) {
    deleteDemoWorkspaceItem(itemId);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_workspace_items")
    .delete()
    .eq("id", itemId)
    .eq("trip_id", tripId);
  if (error) throw new Error(error.message);
  revalidatePath(`/trips/${tripId}`);
}
