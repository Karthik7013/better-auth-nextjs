import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { listAdminFeaturedSeries, addFeaturedSeries } from "@/services/featured-series";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await listAdminFeaturedSeries();
    return NextResponse.json({ featured: result }, {
      headers: { "Cache-Control": "private, max-age=60, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch featured series" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { seriesId } = body;

    if (!seriesId) {
      return NextResponse.json({ error: "seriesId is required" }, { status: 400 });
    }

    const created = await addFeaturedSeries(seriesId);
    return NextResponse.json({ featured: created }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    if (err?.message?.includes("unique") || err?.code === "23505") {
      return NextResponse.json({ error: "Series is already featured" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add featured series" }, { status: 500 });
  }
}
