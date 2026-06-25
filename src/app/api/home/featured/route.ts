import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getFeatured } from "@/services/featured";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const featured = await getFeatured();
    return NextResponse.json({ featured });
  } catch (e) {
    console.error("api/home/featured error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Internal Server Error", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
