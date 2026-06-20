import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { featuredMovies, movies, movieTags, tags } from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const featured = await db
      .select({
        id: movies.id,
        title: movies.title,
        slug: movies.slug,
        description: movies.description,
        releaseDate: movies.releaseDate,
        durationSeconds: movies.durationSeconds,
        thumbnailUrl: movies.thumbnailUrl,
        backdropUrl: movies.backdropUrl,
      })
      .from(featuredMovies)
      .innerJoin(movies, eq(featuredMovies.movieId, movies.id))
      .orderBy(asc(featuredMovies.displayOrder));

    if (featured.length > 0) {
      const featuredIds = featured.map((m) => m.id);
      const tagRows = await db
        .select({ movieId: movieTags.movieId, id: tags.id, name: tags.name })
        .from(movieTags)
        .innerJoin(tags, eq(movieTags.tagId, tags.id))
        .where(inArray(movieTags.movieId, featuredIds));

      const tagsByMovie: Record<number, { id: number; name: string }[]> = {};
      for (const row of tagRows) {
        if (!tagsByMovie[row.movieId]) tagsByMovie[row.movieId] = [];
        tagsByMovie[row.movieId].push({ id: row.id, name: row.name });
      }

      for (const movie of featured) {
        (movie as Record<string, unknown>).tags = tagsByMovie[movie.id] || [];
      }
    }

    return NextResponse.json({ featured });
  } catch (e) {
    console.error("api/home/featured error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Internal Server Error", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
