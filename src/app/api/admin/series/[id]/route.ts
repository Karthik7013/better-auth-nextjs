import { NextRequest } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getAdminSeriesById, updateSeries, deleteSeries, validateSlug } from "@/services/series";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const seriesId = parseInt(id);
  if (isNaN(seriesId)) return Response.json({ error: "Invalid ID" }, { status: 400 });

  const result = await getAdminSeriesById(seriesId);
  if (!result) return Response.json({ error: "Series not found" }, { status: 404 });

  return Response.json(result);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const movieId = parseInt(id);
  if (isNaN(movieId)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  const body = await request.json();
  if (body.slug) {
    const slugError = validateSlug(body.slug);
    if (slugError) return Response.json({ error: slugError }, { status: 400 });
  }

  const updated = await updateSeries(movieId, body);
  if (!updated) return Response.json({ error: "Series not found" }, { status: 404 });

  return Response.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const movieId = parseInt(id);
  if (isNaN(movieId)) {
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }

  const deleted = await deleteSeries(movieId);
  if (!deleted) return Response.json({ error: "Series not found" }, { status: 404 });

  return Response.json({ success: true });
}
