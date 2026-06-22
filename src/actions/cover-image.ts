"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/supabase/client";
import { getDemoTripWithDetails, updateDemoTripCover } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { fetchDestinationCoverUrl } from "@/lib/unsplash/destination-cover";

async function getAuthenticatedUser() {
  if (isDemoMode()) {
    const { getDemoUser } = await import("@/lib/demo/store");
    return getDemoUser();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function refreshTripCoverImage(tripId: string): Promise<string | null> {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Not authenticated");

  if (isDemoMode()) {
    const trip = getDemoTripWithDetails(tripId);
    if (!trip || trip.owner_id !== user.id) throw new Error("Trip not found");

    const coverUrl = await fetchDestinationCoverUrl(trip.destination);
    if (coverUrl) {
      updateDemoTripCover(tripId, coverUrl);
      revalidatePath(`/trips/${tripId}`);
      revalidatePath("/dashboard");
    }
    return coverUrl;
  }

  const supabase = await createClient();
  const { data: trip } = await supabase
    .from("trips")
    .select("id, destination, owner_id")
    .eq("id", tripId)
    .single();

  if (!trip || trip.owner_id !== user.id) throw new Error("Trip not found");

  const coverUrl = await fetchDestinationCoverUrl(trip.destination);
  if (coverUrl) {
    await supabase.from("trips").update({ cover_image_url: coverUrl }).eq("id", tripId);
    revalidatePath(`/trips/${tripId}`);
    revalidatePath("/dashboard");
  }

  return coverUrl;
}
