import { NextResponse } from "next/server";
import { isOpenAIConfigured } from "@/lib/ai/openai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/** Lightweight readiness check for the mobile app (no secrets exposed). */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      openaiConfigured: isOpenAIConfigured(),
      api: "packforvacation-mobile",
    },
    { headers: corsHeaders }
  );
}
