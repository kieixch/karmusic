import { fetchFreeToUseTracks } from "@/lib/providers/server";
import { enumParam, intParam, QueryError } from "@/lib/providers/validate";

export const revalidate = 300;

const ORDERS = ["staff_order", "release_date", "random", "plays", "views", "downloads"] as const;

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = intParam(url.searchParams.get("limit"), 20, 1, 50);
    const offset = intParam(url.searchParams.get("offset"), 0, 0, 100_000);
    const order = enumParam(url.searchParams.get("order"), ORDERS, "staff_order");
    const sort = enumParam(url.searchParams.get("sort"), ["asc", "desc"] as const, "desc");
    const page = await fetchFreeToUseTracks({ limit, offset, order, sort });
    return Response.json(
      { provider: "freetouse", ...page },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    if (error instanceof QueryError) return fail(error.message, 400);
    return fail("The Free To Use catalog is unavailable right now. Local music still works.", 502);
  }
}
