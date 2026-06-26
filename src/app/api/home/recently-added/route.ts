import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { cacheGetOrSet } from "@/lib/cache";
import { getRecentlyAdded } from "@/services/recent";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const recentlyAdded = await cacheGetOrSet("home:recently-added", 600, () => getRecentlyAdded());
    return NextResponse.json({ recentlyAdded }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
  } catch (e) {
    console.error("api/home/recently-added error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Internal Server Error", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
