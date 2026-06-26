import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getAllTags } from "@/services/tags";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getAllTags();
    return NextResponse.json(result, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
  } catch {
    return NextResponse.json({ error: "Fetch Failed" }, { status: 500 });
  }
}
