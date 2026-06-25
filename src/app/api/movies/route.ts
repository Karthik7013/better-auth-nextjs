import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { cacheGetOrSet } from "@/lib/cache";
import { searchMovies } from "@/services/movies";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const tagsParam = searchParams.get("tags") || undefined;
  const cursor = parseInt(searchParams.get("cursor") || "0");
  const limit = parseInt(searchParams.get("limit") || "12");

  try {
    if (tagsParam) {
      const result = await searchMovies({ q, tagsParam, cursor, limit });
      const lastItem = result.movies[result.movies.length - 1];
      return NextResponse.json({
        movies: result.movies,
        total: result.total,
        nextCursor: lastItem ? lastItem.id : null,
        hasMore: result.movies.length === limit,
      });
    }

    const isDefaultPage = !q && cursor === 0;
    const result = isDefaultPage
      ? await cacheGetOrSet(`movies:page1:${limit}`, 120, () => searchMovies({ q, tagsParam, cursor, limit }))
      : await searchMovies({ q, tagsParam, cursor, limit });

    const lastItem = result.movies[result.movies.length - 1];
    return NextResponse.json({
      movies: result.movies,
      total: result.total,
      nextCursor: lastItem ? lastItem.id : null,
      hasMore: result.movies.length === limit,
    });
  } catch {
    return NextResponse.json({ error: "Query Failed" }, { status: 500 });
  }
}
