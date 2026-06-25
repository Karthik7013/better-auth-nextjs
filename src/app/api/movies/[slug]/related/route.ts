import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { cacheGetOrSet } from "@/lib/cache";
import { getRelatedMovies } from "@/services/movies";

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
    const related = await cacheGetOrSet(`related:${slug}`, 600, () => getRelatedMovies(slug));
    return NextResponse.json({ related });
  } catch {
    return NextResponse.json({ related: [] });
  }
}
