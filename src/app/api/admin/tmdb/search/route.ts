import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { searchTMDB, searchTMDBTV } from "@/services/tmdb";

export async function POST(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { query, mediaType = "movie" } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const results = mediaType === "tv" ? await searchTMDBTV(query) : await searchTMDB(query);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "TMDB search failed" }, { status: 500 });
  }
}
