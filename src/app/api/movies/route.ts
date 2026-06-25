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
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "12")));
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortDirParam = searchParams.get("sortDir");
  const sortDir = sortDirParam === "asc" || sortDirParam === "desc" ? sortDirParam : undefined;

  try {
    const isDefaultPage = !q && !tagsParam && page === 1 && !sortBy && !sortDir;
    const result = isDefaultPage
      ? await cacheGetOrSet(`movies:page1:${limit}`, 300, () => searchMovies({ q, tagsParam, page, limit, sortBy, sortDir }))
      : await searchMovies({ q, tagsParam, page, limit, sortBy, sortDir });

    return NextResponse.json({
      movies: result.movies,
      total: result.total,
      page,
      hasMore: page * limit < result.total,
    });
  } catch {
    return NextResponse.json({ error: "Query Failed" }, { status: 500 });
  }
}
