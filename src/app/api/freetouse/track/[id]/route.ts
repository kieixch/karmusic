import { fetchFreeToUseTrack } from "@/lib/providers/server";
import { QueryError, uuidParam } from "@/lib/providers/validate";

export const revalidate = 300;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const track = await fetchFreeToUseTrack(uuidParam(id));
    if (!track) {
      return Response.json({ error: "Track not found." }, { status: 404 });
    }
    return Response.json(
      { provider: "freetouse", track },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (error) {
    if (error instanceof QueryError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Could not refresh this online track." }, { status: 502 });
  }
}
