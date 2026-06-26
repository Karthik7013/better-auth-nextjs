import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { cacheGetOrSet } from "@/lib/cache";
import { getContinueWatching } from "@/services/history";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const continueWatching = await cacheGetOrSet(
      `continue-watching:${session.user.id}`,
      60,
      () => getContinueWatching(session.user.id)
    );

    return NextResponse.json({ continueWatching }, { headers: { "Cache-Control": "private, max-age=60, s-maxage=0" } });
  } catch (e) {
    console.error("api/home/continue-watching error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Internal Server Error", detail: e instanceof Error ? e.message : "Unknown" },
      { status: 500 }
    );
  }
}
