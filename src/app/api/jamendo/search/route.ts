import { fetchJamendoTracks, isJamendoConfigured } from "@/lib/providers/server";
import { intParam, QueryError, searchQuery } from "@/lib/providers/validate";

export const revalidate = 120;

export async function GET(request: Request) {
  if (!isJamendoConfigured()) {
    return Response.json(
      { error: "Jamendo is not configured on this deployment.", configured: false },
      { status: 503 },
    );
  }
  try {
    const url = new URL(request.url);
    const query = searchQuery(url.searchParams.get("query"));
    const limit = intParam(url.searchParams.get("limit"), 20, 1, 50);
    const offset = intParam(url.searchParams.get("offset"), 0, 0, 100_000);
    const page = await fetchJamendoTracks({ limit, offset, query });
    return Response.json(
      { provider: "jamendo", query, ...page },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } },
    );
  } catch (error) {
    if (error instanceof QueryError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Jamendo search failed." }, { status: 502 });
  }
}
