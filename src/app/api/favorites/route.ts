import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { cacheGetOrSet } from "@/lib/cache";
import { getUserFavorites } from "@/services/favorites";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const moviesList = await cacheGetOrSet(
      `favorites:${session.user.id}`,
      120,
      () => getUserFavorites(session.user.id)
    );

    return NextResponse.json({ movies: moviesList });
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
