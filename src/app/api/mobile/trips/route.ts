import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { generateTripContent } from "@/lib/ai/packing-generator";
import { authenticateMobileRequest } from "@/lib/supabase/mobile-server";
import { buildTripSpecialNotes } from "@/lib/trip-notes";
import { fetchDestinationCoverUrl } from "@/lib/unsplash/destination-cover";
import { fetchWeather } from "@/lib/weather/weather-service";
import type { GearItem, TripOnboardingData } from "@/lib/types";

const travelerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  traveler_type: z.enum(["adult", "child", "infant", "pet"]),
  pet_species: z.enum(["dog", "cat", "other"]).optional(),
  pet_size: z.enum(["small", "medium", "large"]).optional(),
});

const tripSchema = z
  .object({
    destination: z.string().trim().min(2).max(200),
    start_date: z.iso.date(),
    end_date: z.iso.date(),
    travelers: z.array(travelerSchema).min(1).max(20),
    travel_type: z.enum(["carry_on", "checked_bag", "multiple_bags", "road_trip"]),
    laundry_access: z.enum(["none", "limited", "full"]),
    style_preference: z.enum([
      "casual",
      "smart_casual",
      "business",
      "formal",
      "athletic",
      "minimalist",
    ]),
    style_preferences: z
      .array(
        z.enum([
          "casual",
          "smart_casual",
          "business",
          "formal",
          "athletic",
          "minimalist",
        ])
      )
      .min(1),
    packing_mode: z.enum(["standard", "minimalist", "comfort", "carry_on_optimized"]),
    activities: z.array(z.string().trim().min(1).max(100)).max(30),
    special_notes: z.string().max(3000),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: "Return date must be on or after the departure date",
    path: ["end_date"],
  });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function json(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init?.headers ?? {}),
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = tripSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return json(
      { error: parsed.error.issues[0]?.message ?? "Invalid trip details" },
      { status: 400 }
    );
  }

  const data = parsed.data as TripOnboardingData;
  const { supabase, user } = auth;
  let tripId: string | null = null;

  try {
    const [weather, coverImageUrl] = await Promise.all([
      fetchWeather(data.destination, data.start_date, data.end_date),
      fetchDestinationCoverUrl(data.destination),
    ]);

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({
        owner_id: user.id,
        destination: data.destination,
        start_date: data.start_date,
        end_date: data.end_date,
        travel_type: data.travel_type,
        laundry_access: data.laundry_access,
        style_preference: data.style_preference,
        style_preferences: data.style_preferences,
        packing_mode: data.packing_mode,
        special_notes: buildTripSpecialNotes(data) || null,
        weather_data: weather,
        cover_image_url: coverImageUrl,
      })
      .select()
      .single();

    if (tripError || !trip) throw new Error(tripError?.message ?? "Failed to create trip");
    tripId = trip.id;

    const { error: memberError } = await supabase.from("trip_members").insert({
      trip_id: trip.id,
      user_id: user.id,
      role: "owner",
    });
    if (memberError) throw new Error(memberError.message);

    const { data: travelers, error: travelersError } = await supabase
      .from("travelers")
      .insert(
        data.travelers.map((traveler, index) => ({
          trip_id: trip.id,
          name: traveler.name,
          traveler_type: traveler.traveler_type,
          pet_species: traveler.traveler_type === "pet" ? traveler.pet_species ?? "dog" : null,
          pet_size: traveler.traveler_type === "pet" ? traveler.pet_size ?? "medium" : null,
          sort_order: index,
        }))
      )
      .select();
    if (travelersError || !travelers?.length) {
      throw new Error(travelersError?.message ?? "Failed to save travelers");
    }

    if (data.activities.length) {
      const { error: activitiesError } = await supabase.from("activities").insert(
        data.activities.map((activityName) => ({
          trip_id: trip.id,
          activity_name: activityName,
        }))
      );
      if (activitiesError) throw new Error(activitiesError.message);
    }

    const { data: gearData, error: gearError } = await supabase
      .from("gear_items")
      .select("*")
      .eq("user_id", user.id);
    if (gearError) throw new Error(gearError.message);

    const generated = await generateTripContent(
      data,
      weather,
      travelers.map((traveler) => ({ name: traveler.name, id: traveler.id })),
      (gearData ?? []) as GearItem[]
    );

    const writes = [];
    if (generated.packing_items.length) {
      writes.push(
        supabase
          .from("packing_items")
          .insert(generated.packing_items.map((item) => ({ ...item, trip_id: trip.id })))
      );
    }
    if (generated.outfits.length) {
      writes.push(
        supabase
          .from("outfits")
          .insert(generated.outfits.map((outfit) => ({ ...outfit, trip_id: trip.id })))
      );
    }
    if (generated.calendar_days.length) {
      writes.push(
        supabase
          .from("calendar_days")
          .insert(generated.calendar_days.map((day) => ({ ...day, trip_id: trip.id })))
      );
    }

    const writeResults = await Promise.all(writes);
    const writeError = writeResults.find((result) => result.error)?.error;
    if (writeError) throw new Error(writeError.message);

    const arrivalNotes = buildTripSpecialNotes(data);
    if (arrivalNotes) {
      const { error: workspaceError } = await supabase.from("trip_workspace_items").insert({
        trip_id: trip.id,
        kind: "arrival",
        title: "Trip and arrival notes",
        details: arrivalNotes,
      });
      if (workspaceError && workspaceError.code !== "42P01") {
        throw new Error(workspaceError.message);
      }
    }

    for (const traveler of data.travelers) {
      const { data: existing } = await supabase
        .from("group_members")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", traveler.name)
        .eq("traveler_type", traveler.traveler_type)
        .maybeSingle();

      if (!existing) {
        await supabase.from("group_members").insert({
          user_id: user.id,
          name: traveler.name,
          traveler_type: traveler.traveler_type,
          pet_species: traveler.traveler_type === "pet" ? traveler.pet_species ?? "dog" : null,
          pet_size: traveler.traveler_type === "pet" ? traveler.pet_size ?? "medium" : null,
        });
      }
    }

    return json({ tripId: trip.id }, { status: 201 });
  } catch (cause) {
    if (tripId) {
      await supabase.from("trips").delete().eq("id", tripId);
    }
    console.error("Mobile trip creation failed:", cause);
    return json(
      { error: cause instanceof Error ? cause.message : "Could not create trip" },
      { status: 500 }
    );
  }
}
