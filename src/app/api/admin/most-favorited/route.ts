import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getMostFavorited } from "@/services/movies";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const mostFavorited = await getMostFavorited();
    return NextResponse.json({ mostFavorited }, {
      headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" }
    });
  } catch (e) {
    console.error("api/admin/most-favorited error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
