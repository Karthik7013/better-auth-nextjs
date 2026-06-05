import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { movies, watchHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const movie = await db
    .select({ id: movies.id })
    .from(movies)
    .where(eq(movies.slug, slug))
    .limit(1);

  if (movie.length === 0) {
    return NextResponse.json({ error: "Movie not found" }, { status: 404 });
  }

  const movieId = movie[0].id;
  const body = await request.json();
  const progressSeconds = body.progressSeconds as number;
  const isCompleted = body.isCompleted as boolean;

  if (typeof progressSeconds !== "number" || progressSeconds < 0) {
    return NextResponse.json({ error: "Invalid progress" }, { status: 400 });
  }

  try {
    const existing = await db
      .select()
      .from(watchHistory)
      .where(
        and(
          eq(watchHistory.userId, session.user.id),
          eq(watchHistory.movieId, movieId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(watchHistory)
        .set({
          progressSeconds,
          isCompleted: isCompleted ?? existing[0].isCompleted,
          watchedAt: new Date(),
        })
        .where(eq(watchHistory.id, existing[0].id));
    } else {
      await db.insert(watchHistory).values({
        userId: session.user.id,
        movieId,
        progressSeconds,
        isCompleted: isCompleted ?? false,
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}
