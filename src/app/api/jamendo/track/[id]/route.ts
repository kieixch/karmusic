import { fetchJamendoTrack, isJamendoConfigured } from "@/lib/providers/server";
import { numericIdParam, QueryError } from "@/lib/providers/validate";

export const revalidate = 300;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isJamendoConfigured()) {
    return Response.json({ error: "Jamendo is not configured.", configured: false }, { status: 503 });
  }
  try {
    const { id } = await context.params;
    const track = await fetchJamendoTrack(numericIdParam(id));
    if (!track) return Response.json({ error: "Track not found." }, { status: 404 });
    return Response.json(
      { provider: "jamendo", track },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
    );
  } catch (error) {
    if (error instanceof QueryError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return Response.json({ error: "Could not refresh this Jamendo track." }, { status: 502 });
  }
}
