import { NextResponse, type NextRequest } from "next/server";
import { authenticateMobileRequest } from "@/lib/supabase/mobile-server";
import { joinTripByShareToken } from "@/actions/trips";

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

export async function POST(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth) return json({ error: "Unauthorized" }, { status: 401 });

  let token = "";
  try {
    const body = (await request.json()) as { token?: string; url?: string };
    token = (body.token ?? "").trim();
    if (!token && body.url) {
      const match = body.url.match(/\/trips\/join\/([A-Za-z0-9_-]+)/);
      token = match?.[1] ?? "";
    }
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!token) return json({ error: "Invite token is required" }, { status: 400 });

  try {
    const { tripId } = await joinTripByShareToken(token, {
      id: auth.user.id,
      email: auth.user.email ?? null,
      name:
        (auth.user.user_metadata?.full_name as string | undefined) ??
        (auth.user.user_metadata?.name as string | undefined) ??
        null,
    });
    return json({ tripId });
  } catch (cause) {
    return json(
      { error: cause instanceof Error ? cause.message : "Could not join trip" },
      { status: 400 }
    );
  }
}
