import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { movies, favorites } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  try {
    const result = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        description: movies.description,
        videoUrl: movies.videoUrl,
        thumbnailUrl: movies.thumbnailUrl,
        durationSeconds: movies.durationSeconds,
        releaseDate: movies.releaseDate,
        isFavorited: sql<boolean>`exists(select 1 from ${favorites} where ${eq(favorites.userId, session.user.id)} and ${eq(favorites.movieId, movies.id)})`,
      })
      .from(movies)
      .where(eq(movies.slug, slug))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
