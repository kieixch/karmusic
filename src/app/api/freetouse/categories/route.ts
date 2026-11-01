import { fetchFreeToUseCategories } from "@/lib/providers/server";
import { intParam, QueryError } from "@/lib/providers/validate";

export const revalidate = 3600;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = intParam(url.searchParams.get("limit"), 30, 1, 50);
    const categories = await fetchFreeToUseCategories(limit);
    return Response.json(
      { provider: "freetouse", categories },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } },
    );
  } catch (error) {
    if (error instanceof QueryError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Categories are unavailable right now." }, { status: 502 });
  }
}
