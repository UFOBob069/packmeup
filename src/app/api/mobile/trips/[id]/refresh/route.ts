import { NextResponse, type NextRequest } from "next/server";
import { authenticateMobileRequest } from "@/lib/supabase/mobile-server";
import { fetchWeather } from "@/lib/weather/weather-service";
import type { PackingCategory, WeatherData } from "@/lib/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

interface Recommendation {
  name: string;
  category: PackingCategory;
  activityName?: string;
  travelerId?: string;
  shared?: boolean;
  reason: string;
}

function json(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...corsHeaders, ...(init?.headers ?? {}) },
  });
}

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

function includesAny(value: string, terms: string[]) {
  const haystack = normalized(value);
  return terms.some((term) => haystack.includes(term));
}

function weatherRecommendations(weather: WeatherData): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const rainExpected = weather.daily.some(
    (day) => day.rain_chance >= 40 || includesAny(day.conditions, ["rain", "drizzle", "storm"])
  );
  const coldExpected = weather.daily.some((day) => day.temp_low <= 48);
  const hotExpected = weather.daily.some((day) => day.temp_high >= 85);

  if (rainExpected) {
    recommendations.push(
      {
        name: "Rain jacket",
        category: "clothing",
        shared: false,
        reason: "Rain is in the forecast",
      },
      {
        name: "Waterproof shoes",
        category: "shoes",
        shared: false,
        reason: "Rain is in the forecast",
      }
    );
  }
  if (coldExpected) {
    recommendations.push({
      name: "Warm layer",
      category: "clothing",
      shared: false,
      reason: "Cool temperatures are expected",
    });
  }
  if (hotExpected) {
    recommendations.push(
      {
        name: "Sunscreen",
        category: "toiletries",
        shared: true,
        reason: "Hot weather is expected",
      },
      {
        name: "Reusable water bottle",
        category: "miscellaneous",
        shared: false,
        reason: "Hot weather is expected",
      }
    );
  }
  return recommendations;
}

function activityRecommendations(activity: string): Recommendation[] {
  if (includesAny(activity, ["golf", "tee time"])) {
    return [
      {
        name: "Golf shoes",
        category: "shoes",
        activityName: activity,
        reason: `${activity} is on the trip`,
      },
      {
        name: "Golf glove",
        category: "activity_gear",
        activityName: activity,
        reason: `${activity} is on the trip`,
      },
      {
        name: "Cooling towel",
        category: "activity_gear",
        activityName: activity,
        reason: `${activity} is on the trip`,
      },
    ];
  }
  if (includesAny(activity, ["hike", "hiking", "trail"])) {
    return [
      {
        name: "Hiking shoes",
        category: "shoes",
        activityName: activity,
        reason: `${activity} is on the trip`,
      },
      {
        name: "Daypack",
        category: "activity_gear",
        activityName: activity,
        reason: `${activity} is on the trip`,
      },
    ];
  }
  if (includesAny(activity, ["beach", "pool", "swim"])) {
    return [
      {
        name: "Swimsuit",
        category: "clothing",
        activityName: activity,
        reason: `${activity} is on the trip`,
      },
      {
        name: "Beach towel",
        category: "activity_gear",
        activityName: activity,
        reason: `${activity} is on the trip`,
      },
    ];
  }
  return [];
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateMobileRequest(request);
  if (!auth) return json({ error: "Unauthorized" }, { status: 401 });

  const { id: tripId } = await context.params;
  const { supabase } = auth;
  const [tripResult, activitiesResult, travelersResult, itemsResult] = await Promise.all([
    supabase
      .from("trips")
      .select("id, destination, start_date, end_date, weather_data")
      .eq("id", tripId)
      .single(),
    supabase.from("activities").select("activity_name").eq("trip_id", tripId),
    supabase
      .from("travelers")
      .select("id, name, traveler_type, pet_species")
      .eq("trip_id", tripId),
    supabase.from("packing_items").select("item_name").eq("trip_id", tripId),
  ]);

  if (tripResult.error || !tripResult.data) {
    return json({ error: "Trip not found" }, { status: 404 });
  }

  const trip = tripResult.data;
  const weather = await fetchWeather(trip.destination, trip.start_date, trip.end_date);
  const recommendations: Recommendation[] = weather ? weatherRecommendations(weather) : [];

  for (const activity of activitiesResult.data ?? []) {
    recommendations.push(...activityRecommendations(activity.activity_name));
  }

  for (const traveler of travelersResult.data ?? []) {
    if (traveler.traveler_type !== "pet") continue;
    recommendations.push(
      {
        name: `${traveler.name}'s food`,
        category: "pet_supplies",
        travelerId: traveler.id,
        reason: `${traveler.name} is traveling`,
      },
      {
        name: `${traveler.name}'s leash or carrier`,
        category: "pet_supplies",
        travelerId: traveler.id,
        reason: `${traveler.name} is traveling`,
      },
      {
        name: `${traveler.name}'s vaccination record`,
        category: "travel_documents",
        travelerId: traveler.id,
        reason: `${traveler.name} is traveling`,
      }
    );
  }

  const existing = new Set((itemsResult.data ?? []).map((item) => normalized(item.item_name)));
  const uniqueRecommendations = recommendations.filter((item) => {
    const key = normalized(item.name);
    if (existing.has(key)) return false;
    existing.add(key);
    return true;
  });

  if (uniqueRecommendations.length > 0) {
    const { error: insertError } = await supabase.from("packing_items").insert(
      uniqueRecommendations.map((item, index) => ({
        trip_id: tripId,
        traveler_id: item.travelerId ?? null,
        category: item.category,
        item_name: item.name,
        quantity: 1,
        packed: false,
        shared: item.shared ?? !item.travelerId,
        activity_name: item.activityName ?? null,
        notes: `Added automatically: ${item.reason}`,
        sort_order: 1000 + index,
      }))
    );
    if (insertError) return json({ error: insertError.message }, { status: 500 });
  }

  if (weather) {
    const { error: weatherError } = await supabase
      .from("trips")
      .update({ weather_data: weather })
      .eq("id", tripId);
    if (weatherError) return json({ error: weatherError.message }, { status: 500 });
  }

  return json({
    weather,
    addedItems: uniqueRecommendations.map(({ name, reason }) => ({ name, reason })),
  });
}
