import { searchPlaces } from "@/lib/mapbox/places";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return Response.json({ suggestions: [] });
  }

  try {
    const suggestions = await searchPlaces(q);
    return Response.json({ suggestions });
  } catch {
    return Response.json({ suggestions: [] }, { status: 500 });
  }
}
