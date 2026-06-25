import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { updateMovie, deleteMovie, validateSlug, validateDuration } from "@/services/movies";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const movieId = parseInt(id);

  try {
    const body = await request.json();
    const { slug, durationSeconds } = body;

    const slugError = slug !== undefined ? validateSlug(slug) : null;
    if (slugError) {
      return NextResponse.json({ error: slugError }, { status: 400 });
    }

    const durationError = validateDuration(durationSeconds);
    if (durationError) {
      return NextResponse.json({ error: durationError }, { status: 400 });
    }

    const updatedMovie = await updateMovie(movieId, body);

    if (!updatedMovie) {
      return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
    }

    return NextResponse.json(updatedMovie);
  } catch {
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const movieId = parseInt(id);

  try {
    const deleted = await deleteMovie(movieId);
    if (!deleted) {
      return NextResponse.json({ error: "Movie Not Found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}
