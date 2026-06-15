import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { movies, favorites, movieTags } from "@/db/schema";
import { eq, and, sql, ne, inArray, desc } from "drizzle-orm";

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

    const movie = result[0];

    const tagRows = await db
      .select({ tagId: movieTags.tagId })
      .from(movieTags)
      .where(eq(movieTags.movieId, movie.id));

    let related: { id: number; title: string; slug: string; thumbnailUrl: string }[] = [];
    if (tagRows.length > 0) {
      const tagIds = tagRows.map((t) => t.tagId);
      related = await db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          thumbnailUrl: movies.thumbnailUrl,
        })
        .from(movies)
        .innerJoin(movieTags, eq(movies.id, movieTags.movieId))
        .where(
          and(
            inArray(movieTags.tagId, tagIds),
            ne(movies.id, movie.id),
          )
        )
        .groupBy(movies.id)
        .orderBy(desc(movies.createdAt))
        .limit(6);
    }

    return NextResponse.json({ ...movie, related });
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
