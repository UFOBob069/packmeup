"use server";

import { revalidatePath } from "next/cache";
import { addDemoTripActivity, deleteDemoTripActivity } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

export async function addTripActivity(tripId: string, activityName: string) {
  const trimmed = activityName.trim();
  if (!trimmed) throw new Error("An activity name is required");

  if (isDemoMode()) {
    addDemoTripActivity(tripId, trimmed);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("activities")
    .select("id")
    .eq("trip_id", tripId)
    .ilike("activity_name", trimmed)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("activities").insert({
      trip_id: tripId,
      activity_name: trimmed,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/trips/${tripId}`);
}

export async function deleteTripActivity(tripId: string, activityId: string) {
  if (isDemoMode()) {
    deleteDemoTripActivity(tripId, activityId);
    revalidatePath(`/trips/${tripId}`);
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId)
    .eq("trip_id", tripId);
  if (error) throw new Error(error.message);

  revalidatePath(`/trips/${tripId}`);
}
