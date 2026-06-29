import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { cacheGetOrSet } from "@/lib/cache";
import { getMovieBySlug, checkFavorite, movieDetailToResponse } from "@/services/movies";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const base = await cacheGetOrSet(`movie:${slug}`, 300, () => getMovieBySlug(slug));

    if (!base) {
      return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
    }

    const isFavorited = await checkFavorite(base.id, session.user.id);

    return NextResponse.json(movieDetailToResponse(base, isFavorited), {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" }
    });
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
