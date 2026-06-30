import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getFeaturedSeries } from "@/services/featured-series";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const featured = await getFeaturedSeries();
    return NextResponse.json({ featured }, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    console.error("api/series/featured error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Internal Server Error", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
