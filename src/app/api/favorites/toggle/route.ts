import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { toggleFavorite } from "@/services/favorites";

export async function POST(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { movieId } = await request.json();
  if (typeof movieId !== "number") {
    return NextResponse.json({ error: "Invalid movieId" }, { status: 400 });
  }

  try {
    const result = await toggleFavorite(movieId, session.user.id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Toggle Failed" }, { status: 500 });
  }
}
