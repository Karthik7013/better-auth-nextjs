import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { updateFeaturedSeriesOrder, deleteFeaturedSeries } from "@/services/featured-series";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { displayOrder } = body;

    const updated = await updateFeaturedSeriesOrder(parseInt(id), displayOrder);
    if (!updated) {
      return NextResponse.json({ error: "Featured series not found" }, { status: 404 });
    }

    return NextResponse.json({ featured: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update featured series" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await deleteFeaturedSeries(parseInt(id));

    if (!deleted) {
      return NextResponse.json({ error: "Featured series not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete featured series" }, { status: 500 });
  }
}
