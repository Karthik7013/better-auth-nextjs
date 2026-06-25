import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { movies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateProgress } from "@/services/history";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getCachedSession(request);
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

  try {
    const result = await updateProgress({ userId: session.user.id, movieId, progressSeconds, isCompleted });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}
