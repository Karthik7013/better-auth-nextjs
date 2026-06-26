import { NextRequest } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getSeasonsBySeriesId, createSeason } from "@/services/series";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const seriesId = parseInt(id);
  if (isNaN(seriesId)) return Response.json({ error: "Invalid ID" }, { status: 400 });

  const seasons = await getSeasonsBySeriesId(seriesId);
  return Response.json({ seasons });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const seriesId = parseInt(id);
  if (isNaN(seriesId)) return Response.json({ error: "Invalid ID" }, { status: 400 });

  const body = await request.json();
  const created = await createSeason(seriesId, body);
  return Response.json(created, { status: 201 });
}
