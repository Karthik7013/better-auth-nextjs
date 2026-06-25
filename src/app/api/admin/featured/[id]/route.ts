import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { updateFeatured, deleteFeatured } from "@/services/featured";

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

    const updated = await updateFeatured(parseInt(id), displayOrder);
    if (!updated) {
      return NextResponse.json({ error: "Featured movie not found" }, { status: 404 });
    }

    return NextResponse.json({ featured: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update featured movie" }, { status: 500 });
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
    const deleted = await deleteFeatured(parseInt(id));

    if (!deleted) {
      return NextResponse.json({ error: "Featured movie not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete featured movie" }, { status: 500 });
  }
}
