import { fetchJamendoTracks, isJamendoConfigured } from "@/lib/providers/server";
import { intParam, QueryError } from "@/lib/providers/validate";

export const revalidate = 300;

export async function GET(request: Request) {
  if (!isJamendoConfigured()) {
    return Response.json(
      {
        error: "Jamendo is not configured on this deployment.",
        configured: false,
      },
      { status: 503 },
    );
  }
  try {
    const url = new URL(request.url);
    const limit = intParam(url.searchParams.get("limit"), 20, 1, 50);
    const offset = intParam(url.searchParams.get("offset"), 0, 0, 100_000);
    const page = await fetchJamendoTracks({ limit, offset });
    return Response.json(
      { provider: "jamendo", ...page },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (error) {
    if (error instanceof QueryError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Jamendo is unavailable right now." }, { status: 502 });
  }
}
