export interface PlaceSuggestion {
  id: string;
  label: string;
  shortLabel: string;
  lat: number;
  lng: number;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
  place_type?: string[];
  context?: { id: string; text: string; short_code?: string }[];
}

interface MapboxGeocodingResponse {
  features: MapboxFeature[];
  message?: string;
}

export function isMapboxConfigured(): boolean {
  return !!getMapboxToken();
}

export function getMapboxToken(): string | undefined {
  const token =
    process.env.MAPBOX_ACCESS_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
  if (!token || token === "pk.your-mapbox-token") return undefined;
  return token;
}

/** Shorter display label, e.g. "Scottsdale, Arizona" */
export function formatPlaceShortLabel(feature: MapboxFeature): string {
  const parts: string[] = [feature.text];
  const region = feature.context?.find((c) => c.id.startsWith("region."))?.text;
  const country = feature.context?.find((c) => c.id.startsWith("country."))?.text;

  if (region && region !== feature.text) {
    parts.push(region);
  } else if (country && country !== feature.text) {
    parts.push(country);
  }

  return parts.join(", ");
}

export function mapboxFeatureToSuggestion(feature: MapboxFeature): PlaceSuggestion {
  return {
    id: feature.id,
    label: feature.place_name,
    shortLabel: formatPlaceShortLabel(feature),
    lat: feature.center[1],
    lng: feature.center[0],
  };
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const token = getMapboxToken();
  if (!token || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    access_token: token,
    autocomplete: "true",
    language: "en",
    limit: "8",
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.trim())}.json?${params}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    console.error("Mapbox geocoding failed:", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as MapboxGeocodingResponse;
  return (data.features ?? []).map(mapboxFeatureToSuggestion);
}
