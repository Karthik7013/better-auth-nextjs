import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { watchHistory } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const movieId = parseInt(id);
  if (isNaN(movieId)) {
    return NextResponse.json({ error: "Invalid movie ID" }, { status: 400 });
  }

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
