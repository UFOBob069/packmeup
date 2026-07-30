import { NextResponse, type NextRequest } from "next/server";
import { authenticateMobileRequest } from "@/lib/supabase/mobile-server";
import { createAdminClient } from "@/lib/supabase/admin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
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

/** Permanent account deletion for the authenticated mobile user. */
export async function DELETE(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth) return json({ error: "Unauthorized" }, { status: 401 });

  const { user } = auth;

  try {
    const admin = createAdminClient();

    const { error: tripsError } = await admin.from("trips").delete().eq("owner_id", user.id);
    if (tripsError) throw new Error(tripsError.message);

    const { error: profileError } = await admin.from("profiles").delete().eq("id", user.id);
    if (profileError) throw new Error(profileError.message);

    const { error: authError } = await admin.auth.admin.deleteUser(user.id);
    if (authError) throw new Error(authError.message);

    return json({ ok: true });
  } catch (cause) {
    console.error("Mobile account deletion failed:", cause);
    return json(
      { error: cause instanceof Error ? cause.message : "Could not delete account" },
      { status: 500 }
    );
  }
}
