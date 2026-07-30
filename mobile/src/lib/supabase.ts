import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Canonical API host. Apex packforvacation.com 308-redirects to www;
 * browsers/WebViews strip Authorization on that redirect, which breaks AI calls.
 */
function resolveApiUrl(raw: string | undefined) {
  const trimmed = (raw ?? "https://www.packforvacation.com").replace(/\/$/, "");
  try {
    const url = new URL(trimmed);
    if (url.hostname === "packforvacation.com") {
      url.hostname = "www.packforvacation.com";
    }
    return url.origin;
  } catch {
    return "https://www.packforvacation.com";
  }
}

export const apiUrl = resolveApiUrl(import.meta.env.VITE_API_URL as string | undefined);

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

export function assertSupabaseConfigured() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy mobile/.env.example to mobile/.env."
    );
  }
}
