/** Canonical app URL for OAuth redirects (must match Supabase redirect allow list). */
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured && configured !== "http://localhost:3000") {
    return configured;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return configured ?? "http://localhost:3000";
}
