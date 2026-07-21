/** Canonical app URL for OAuth redirects (must match Supabase redirect allow list). */
export function getAppUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  return normalizeAppUrl(raw);
}

/** Strip trailing slashes and accidental FQDN trailing dots (e.g. packforvacation.com.). */
export function normalizeAppUrl(input: string): string {
  let url = input.trim();
  if (!url) return "http://localhost:3000";

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    // DNS absolute-name dots (host.) break browsers: packforvacation.com. → connection closed
    parsed.hostname = parsed.hostname.replace(/\.+$/, "");
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    const origin = parsed.origin;
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${origin}${path}`;
  } catch {
    return url.replace(/\/+$/, "").replace(/\.+(?=\/|$)/, "");
  }
}
