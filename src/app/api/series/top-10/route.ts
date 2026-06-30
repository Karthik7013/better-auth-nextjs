import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getTop10Series } from "@/services/series-recent";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const top10 = await getTop10Series();
    return NextResponse.json({ top10 }, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    console.error("api/series/top-10 error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Internal Server Error", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
