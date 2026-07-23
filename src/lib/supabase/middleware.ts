import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isDemoModeEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configured =
    !!url && !!key && url !== "https://your-project.supabase.co";
  if (!configured) return true;
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith("/trips/join/")) return false;
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/trips") ||
    pathname.startsWith("/templates")
  );
}

export async function updateSession(request: NextRequest) {
  const host = request.nextUrl.hostname;
  // Browsers fail on FQDN trailing dots (packforvacation.com.) — normalize immediately.
  if (host.endsWith(".")) {
    const fixed = request.nextUrl.clone();
    fixed.hostname = host.replace(/\.+$/, "");
    return NextResponse.redirect(fixed, 308);
  }

  // OAuth sometimes falls back to Site URL root with ?code= — send it to the callback route.
  const authCode = request.nextUrl.searchParams.get("code");
  if (
    authCode &&
    request.nextUrl.pathname === "/" &&
    !request.nextUrl.pathname.startsWith("/auth/callback")
  ) {
    const callback = request.nextUrl.clone();
    callback.pathname = "/auth/callback";
    return NextResponse.redirect(callback);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl === "https://your-project.supabase.co"
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!isDemoModeEnv() && isProtectedPath(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isDemoModeEnv() && user && pathname === "/login") {
    const next = request.nextUrl.searchParams.get("next");
    const destination = request.nextUrl.clone();
    destination.pathname = next?.startsWith("/") ? next : "/dashboard";
    destination.search = "";
    return NextResponse.redirect(destination);
  }

  // Signed-in visitors hitting the marketing home go straight to their trips.
  if (user && pathname === "/") {
    const dashboard = request.nextUrl.clone();
    dashboard.pathname = "/dashboard";
    dashboard.search = "";
    return NextResponse.redirect(dashboard);
  }

  return supabaseResponse;
}
