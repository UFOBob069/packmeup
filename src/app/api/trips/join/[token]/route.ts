import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, joinTripByShareToken } from "@/actions/trips";
import { normalizeAppUrl } from "@/lib/app-url";

interface RouteParams {
  params: Promise<{ token: string }>;
}

function requestOrigin(request: NextRequest): string {
  // Stay on the same host the browser used (www vs apex) so auth cookies stick.
  return normalizeAppUrl(request.nextUrl.origin);
}

/**
 * Completes share-link join after Google OAuth.
 * Uses a Route Handler so we never call revalidatePath / mutations during RSC render.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const origin = requestOrigin(request);
  const joinLanding = new URL(`/trips/join/${token}`, origin);

  const user = await getCurrentUser();
  if (!user) {
    const login = new URL("/login", origin);
    login.searchParams.set("next", `/api/trips/join/${token}`);
    return NextResponse.redirect(login);
  }

  try {
    const { tripId } = await joinTripByShareToken(token);
    const tripUrl = new URL(`/trips/${tripId}`, origin);
    tripUrl.searchParams.set("joined", "1");
    return NextResponse.redirect(tripUrl);
  } catch (error) {
    console.error("Share join failed:", error);
    joinLanding.searchParams.set("error", "join");
    return NextResponse.redirect(joinLanding);
  }
}
