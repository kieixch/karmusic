import { fetchFreeToUseCategoryTracks } from "@/lib/providers/server";
import { enumParam, intParam, QueryError, uuidParam } from "@/lib/providers/validate";

export const revalidate = 300;

const ORDERS = ["release_date", "random", "plays", "views", "downloads"] as const;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const categoryId = uuidParam(id);
    const url = new URL(request.url);
    const limit = intParam(url.searchParams.get("limit"), 20, 1, 50);
    const offset = intParam(url.searchParams.get("offset"), 0, 0, 100_000);
    const order = enumParam(url.searchParams.get("order"), ORDERS, "random");
    const sort = enumParam(url.searchParams.get("sort"), ["asc", "desc"] as const, "desc");
    const page = await fetchFreeToUseCategoryTracks(categoryId, { limit, offset, order, sort });
    return Response.json(
      { provider: "freetouse", ...page },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (error) {
    if (error instanceof QueryError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "This category is unavailable right now." }, { status: 502 });
  }
}
