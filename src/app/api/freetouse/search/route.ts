import { fetchFreeToUseSearch } from "@/lib/providers/server";
import { intParam, QueryError, searchQuery } from "@/lib/providers/validate";

export const revalidate = 120;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = searchQuery(url.searchParams.get("query"));
    const limit = intParam(url.searchParams.get("limit"), 20, 1, 50);
    const offset = intParam(url.searchParams.get("offset"), 0, 0, 100_000);
    const page = await fetchFreeToUseSearch({ query, limit, offset });
    return Response.json(
      { provider: "freetouse", query, ...page },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } },
    );
  } catch (error) {
    if (error instanceof QueryError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json(
      { error: "Online search failed. Local search is still available." },
      { status: 502 },
    );
  }
}
