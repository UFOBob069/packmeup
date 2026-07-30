import { NextResponse, type NextRequest } from "next/server";
import { authenticateMobileRequest } from "@/lib/supabase/mobile-server";
import { isOpenAIConfigured } from "@/lib/ai/openai";
import { refineWithChat } from "@/lib/ai/chat-refinement";
import { analyzePackingGaps, formatGapsForAi } from "@/lib/packing/gap-analysis";
import type {
  GearItem,
  Outfit,
  PackingItem,
  Traveler,
  Trip,
  TripWithDetails,
} from "@/lib/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function json(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...corsHeaders, ...(init?.headers ?? {}) },
  });
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
  const { supabase, user } = auth;

  let message = "";
  try {
    const body = (await request.json()) as { message?: string };
    message = (body.message ?? "").trim();
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!message) return json({ error: "Message is required" }, { status: 400 });

  if (!isOpenAIConfigured()) {
    return json(
      {
        error:
          "AI is not configured on the server. Add OPENAI_API_KEY in Vercel → Project → Settings → Environment Variables (Production), then redeploy.",
      },
      { status: 503 }
    );
  }

  const { data: tripRow } = await supabase.from("trips").select("*").eq("id", tripId).maybeSingle();
  if (!tripRow) return json({ error: "Trip not found" }, { status: 404 });

  const { data: membership } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  const canEdit =
    tripRow.owner_id === user.id ||
    membership?.role === "owner" ||
    membership?.role === "editor";
  if (!canEdit) return json({ error: "Editors only" }, { status: 403 });

  const [travelers, packingItems, outfits, calendarDays, activities, gearItems, history] =
    await Promise.all([
      supabase.from("travelers").select("*").eq("trip_id", tripId).order("sort_order"),
      supabase.from("packing_items").select("*").eq("trip_id", tripId).order("sort_order"),
      supabase.from("outfits").select("*").eq("trip_id", tripId).order("trip_date"),
      supabase.from("calendar_days").select("*").eq("trip_id", tripId).order("trip_date"),
      supabase.from("activities").select("*").eq("trip_id", tripId),
      supabase.from("gear_items").select("*").eq("user_id", user.id),
      supabase
        .from("chat_messages")
        .select("role, content")
        .eq("trip_id", tripId)
        .eq("channel", "ai")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const trip = {
    ...(tripRow as Trip),
    travelers: (travelers.data ?? []) as Traveler[],
    packing_items: (packingItems.data ?? []) as PackingItem[],
    outfits: (outfits.data ?? []) as Outfit[],
    calendar_days: calendarDays.data ?? [],
    activities: activities.data ?? [],
    workspace_items: [],
    members: [],
  } as TripWithDetails;

  const priorHistory = [...(history.data ?? [])]
    .reverse()
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const packingGaps = analyzePackingGaps(trip, (gearItems.data ?? []) as GearItem[]);
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

  await supabase.from("chat_messages").insert({
    trip_id: tripId,
    user_id: user.id,
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

  return json({
    message: result.message,
    suggestions: result.suggestions,
  });
}
