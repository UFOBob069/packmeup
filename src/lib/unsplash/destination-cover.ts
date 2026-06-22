/**
 * Fetches a destination cover image from Unsplash.
 * Call only on trip create or manual refresh — results are cached in Supabase.
 */

function buildSearchQuery(destination: string): string {
  const city = destination.split(",")[0]?.trim() || destination.trim();
  return `${city} travel destination`;
}

export async function fetchDestinationCoverUrl(destination: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey?.trim()) return null;

  const query = encodeURIComponent(buildSearchQuery(destination));
  const url = `https://api.unsplash.com/search/photos?query=${query}&orientation=landscape&per_page=1&content_filter=high`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Unsplash search failed:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as {
      results?: Array<{
        urls?: { regular?: string; full?: string };
        links?: { download_location?: string };
      }>;
    };

    const photo = data.results?.[0];
    if (!photo?.urls) return null;

    if (photo.links?.download_location) {
      fetch(photo.links.download_location, {
        headers: { Authorization: `Client-ID ${accessKey}` },
      }).catch(() => {});
    }

    return photo.urls.regular ?? photo.urls.full ?? null;
  } catch (error) {
    console.error("Unsplash fetch error:", error);
    return null;
  }
}
