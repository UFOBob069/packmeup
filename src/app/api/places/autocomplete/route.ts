import { isMapboxConfigured, searchPlaces } from "@/lib/mapbox/places";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return Response.json({ suggestions: [], configured: isMapboxConfigured() });
  }

  if (!isMapboxConfigured()) {
    return Response.json({
      suggestions: [],
      configured: false,
      error: "Mapbox token not configured",
    });
  }

  try {
    const suggestions = await searchPlaces(q);
    return Response.json({ suggestions, configured: true });
  } catch (error) {
    console.error("Places autocomplete error:", error);
    return Response.json(
      { suggestions: [], configured: true, error: "Search failed" },
      { status: 500 }
    );
  }
}
