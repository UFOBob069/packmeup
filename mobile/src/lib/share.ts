import { apiUrl } from "./supabase";

export function extractJoinToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const fromUrl = trimmed.match(/\/trips\/join\/([A-Za-z0-9_-]+)/);
  if (fromUrl?.[1]) return fromUrl[1];
  if (/^[A-Za-z0-9_-]{8,}$/.test(trimmed)) return trimmed;
  return null;
}

export function buildShareLink(shareToken: string) {
  return `${apiUrl}/trips/join/${shareToken}`;
}

export function buildShareMessage(details: {
  inviterName: string;
  destination: string;
  startDate: string;
  endDate: string;
  shareLink: string;
}) {
  const city = details.destination.split(",")[0]?.trim() || details.destination;
  const start = new Date(`${details.startDate}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const end = new Date(`${details.endDate}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return [
    `${details.inviterName} invited you to pack for ${city}`,
    `${start} – ${end}`,
    "",
    "Anyone with this link can join — send it in a group text if you want:",
    details.shareLink,
  ].join("\n");
}

export async function shareOrCopyText(title: string, text: string, url?: string) {
  if (typeof navigator !== "undefined" && "share" in navigator) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}
