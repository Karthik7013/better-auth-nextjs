import { NextRequest } from "next/server";
import { getCachedSession } from "@/lib/session";
import { updateSeason, deleteSeason } from "@/services/series";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; sid: string }> }) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sid } = await params;
  const seasonId = parseInt(sid);
  if (isNaN(seasonId)) return Response.json({ error: "Invalid ID" }, { status: 400 });

  const body = await request.json();
  const updated = await updateSeason(seasonId, body);
  if (!updated) return Response.json({ error: "Season not found" }, { status: 404 });

  return Response.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; sid: string }> }) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sid } = await params;
  const seasonId = parseInt(sid);
  if (isNaN(seasonId)) return Response.json({ error: "Invalid ID" }, { status: 400 });

  await deleteSeason(seasonId);
  return Response.json({ success: true });
}
