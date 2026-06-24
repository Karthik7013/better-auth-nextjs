import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { cacheGetOrSet } from "@/lib/cache";
import { db } from "@/db";
import { movies, favorites, movieTags, tags } from "@/db/schema";
import { eq, sql, inArray } from "drizzle-orm";

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
    const base = await cacheGetOrSet(`movie:${slug}`, 300, async () => {
      const result = await db
        .select({
          id: movies.id,
          title: movies.title,
          slug: movies.slug,
          description: movies.description,
          videoUrl: movies.videoUrl,
          thumbnailUrl: movies.thumbnailUrl,
          backdropUrl: movies.backdropUrl,
          durationSeconds: movies.durationSeconds,
          releaseDate: movies.releaseDate,
        })
        .from(movies)
        .where(eq(movies.slug, slug))
        .limit(1);

      if (result.length === 0) return null;

      const row = result[0];

      const tagRows = await db
        .select({ id: tags.id, name: tags.name })
        .from(movieTags)
        .innerJoin(tags, eq(movieTags.tagId, tags.id))
        .where(eq(movieTags.movieId, row.id));

      return { ...row, tags: tagRows };
    });

    if (!base) {
      return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
    }

    const [favorited] = await db
      .select({ isFavorited: sql<boolean>`true` })
      .from(favorites)
      .where(
        sql`${eq(favorites.userId, session.user.id)} and ${eq(favorites.movieId, base.id)}`
      )
      .limit(1);

    return NextResponse.json({ ...base, isFavorited: !!favorited });
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
