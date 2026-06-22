"use server";

import { revalidatePath } from "next/cache";
import { isDemoMode } from "@/lib/supabase/client";
import {
  createDemoTrip,
  deleteDemoTrip,
  getDemoTripWithDetails,
  getDemoTrips,
  getDemoUser,
  saveDemoTemplate,
  updateDemoTripWeather,
} from "@/lib/demo/store";
import { buildTripSpecialNotes } from "@/lib/trip-notes";
import { createClient } from "@/lib/supabase/server";
import { generateTripContent } from "@/lib/ai/packing-generator";
import { fetchWeather } from "@/lib/weather/weather-service";
import { fetchDestinationCoverUrl } from "@/lib/unsplash/destination-cover";
import { getAppUrl } from "@/lib/app-url";
import type { Trip, TripOnboardingData, TripTemplateData, TripWithDetails, WeatherData } from "@/lib/types";

export async function getCurrentUser() {
  if (isDemoMode()) {
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

/** Fetch weather only when missing, then cache on the trip row. */
export async function ensureTripWeather(trip: Trip): Promise<WeatherData | null> {
  const existing = trip.weather_data as WeatherData | null;
  if (existing?.daily?.length) return existing;

  const weather = await fetchWeather(trip.destination, trip.start_date, trip.end_date);
  if (!weather) return null;

  if (isDemoMode()) {
    updateDemoTripWeather(trip.id, weather);
  } else {
    const supabase = await createClient();
    await supabase.from("trips").update({ weather_data: weather }).eq("id", trip.id);
  }

  return weather;
}

export async function getUserTrips(): Promise<Trip[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  if (isDemoMode()) {
    return getDemoTrips(user.id);
  }

  const supabase = await createClient();
  const { data: owned } = await supabase
    .from("trips")
    .select("*")
    .eq("owner_id", user.id)
    .order("start_date", { ascending: true });

  const { data: memberTrips } = await supabase
    .from("trip_members")
    .select("trip:trips(*)")
    .eq("user_id", user.id);

  const shared = (memberTrips ?? [])
    .map((m) => m.trip as unknown as Trip)
    .filter(Boolean);

  const all = [...(owned ?? []), ...shared];
  const unique = Array.from(new Map(all.map((t) => [t.id, t])).values());
  return unique.sort((a, b) => a.start_date.localeCompare(b.start_date));
}

export async function getTripDetails(tripId: string): Promise<TripWithDetails | null> {
  if (isDemoMode()) {
    return getDemoTripWithDetails(tripId);
  }

  const supabase = await createClient();
  const { data: trip } = await supabase.from("trips").select("*").eq("id", tripId).single();
  if (!trip) return null;

  const [travelers, activities, packing_items, outfits, calendar_days, members] =
    await Promise.all([
      supabase.from("travelers").select("*").eq("trip_id", tripId).order("sort_order"),
      supabase.from("activities").select("*").eq("trip_id", tripId),
      supabase.from("packing_items").select("*").eq("trip_id", tripId).order("sort_order"),
      supabase.from("outfits").select("*").eq("trip_id", tripId).order("trip_date"),
      supabase.from("calendar_days").select("*").eq("trip_id", tripId).order("trip_date"),
      supabase
        .from("trip_members")
        .select("*, profile:profiles(*)")
        .eq("trip_id", tripId),
    ]);

  return {
    ...trip,
    travelers: travelers.data ?? [],
    activities: activities.data ?? [],
    packing_items: packing_items.data ?? [],
    outfits: outfits.data ?? [],
    calendar_days: calendar_days.data ?? [],
    members: members.data ?? [],
  } as TripWithDetails;
}

export async function createTrip(data: TripOnboardingData): Promise<TripWithDetails> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  if (isDemoMode()) {
    const trip = await createDemoTrip(user.id, data);
    revalidatePath("/dashboard");
    return trip;
  }

  const supabase = await createClient();
  const [weather, coverImageUrl] = await Promise.all([
    fetchWeather(data.destination, data.start_date, data.end_date),
    fetchDestinationCoverUrl(data.destination),
  ]);

  const { data: trip, error } = await supabase
    .from("trips")
    .insert({
      owner_id: user.id,
      destination: data.destination,
      start_date: data.start_date,
      end_date: data.end_date,
      travel_type: data.travel_type,
      laundry_access: data.laundry_access,
      style_preference: data.style_preference,
      style_preferences: data.style_preferences?.length
        ? data.style_preferences
        : [data.style_preference],
      packing_mode: data.packing_mode,
      special_notes: buildTripSpecialNotes(data) || null,
      weather_data: weather,
      cover_image_url: coverImageUrl,
    })
    .select()
    .single();

  if (error || !trip) throw new Error(error?.message ?? "Failed to create trip");

  await supabase.from("trip_members").insert({
    trip_id: trip.id,
    user_id: user.id,
    role: "owner",
  });

  const travelerInserts = data.travelers.map((t, i) => ({
    trip_id: trip.id,
    name: t.name,
    traveler_type: t.traveler_type,
    pet_species: t.traveler_type === "pet" ? (t.pet_species ?? "dog") : null,
    pet_size: t.traveler_type === "pet" ? (t.pet_size ?? "medium") : null,
    sort_order: i,
  }));

  let travelersInsert = await supabase.from("travelers").insert(travelerInserts).select();

  if (travelersInsert.error?.message?.includes("pet_species")) {
    travelersInsert = await supabase
      .from("travelers")
      .insert(
        data.travelers.map((t, i) => ({
          trip_id: trip.id,
          name: t.name,
          traveler_type: t.traveler_type,
          sort_order: i,
        }))
      )
      .select();
  }

  if (travelersInsert.error || !travelersInsert.data?.length) {
    throw new Error(travelersInsert.error?.message ?? "Failed to save travelers");
  }

  const travelers = travelersInsert.data;

  if (data.activities.length) {
    await supabase.from("activities").insert(
      data.activities.map((name) => ({ trip_id: trip.id, activity_name: name }))
    );
  }

  const travelerIds = (travelers ?? []).map((t) => ({ name: t.name, id: t.id }));
  const generated = await generateTripContent(data, weather, travelerIds);

  if (generated.packing_items.length) {
    await supabase.from("packing_items").insert(
      generated.packing_items.map((item) => ({ ...item, trip_id: trip.id }))
    );
  }

  if (generated.outfits.length) {
    await supabase.from("outfits").insert(
      generated.outfits.map((o) => ({ ...o, trip_id: trip.id }))
    );
  }

  if (generated.calendar_days.length) {
    await supabase.from("calendar_days").insert(
      generated.calendar_days.map((d) => ({ ...d, trip_id: trip.id }))
    );
  }

  revalidatePath("/dashboard");
  const details = await getTripDetails(trip.id);
  if (!details) throw new Error("Failed to load created trip");
  return details;
}

export async function deleteTrip(tripId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  if (isDemoMode()) {
    deleteDemoTrip(tripId);
    revalidatePath("/dashboard");
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", tripId)
    .eq("owner_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function saveTemplate(
  name: string,
  description: string,
  templateData: TripTemplateData
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  if (isDemoMode()) {
    saveDemoTemplate(user.id, name, description, templateData);
    revalidatePath("/dashboard");
    revalidatePath("/templates");
    return;
  }

  const supabase = await createClient();
  await supabase.from("templates").insert({
    user_id: user.id,
    name,
    description,
    template_data: templateData,
  });
  revalidatePath("/dashboard");
  revalidatePath("/templates");
}

export async function signInWithGoogle() {
  if (isDemoMode()) {
    return { url: "/dashboard" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${getAppUrl()}/auth/callback`,
    },
  });

  if (error) throw new Error(error.message);
  return { url: data.url };
}

export async function signOut() {
  if (isDemoMode()) {
    return;
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
}
