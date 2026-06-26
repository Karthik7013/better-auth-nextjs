import { NextRequest } from "next/server";
import { getCachedSession } from "@/lib/session";
import { updateEpisode, deleteEpisode } from "@/services/series";
import { validateSlug } from "@/lib/validation";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; sid: string; eid: string }> }) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eid } = await params;
  const episodeId = parseInt(eid);
  if (isNaN(episodeId)) return Response.json({ error: "Invalid ID" }, { status: 400 });

  const body = await request.json();
  if (body.slug) {
    const slugError = validateSlug(body.slug);
    if (slugError) return Response.json({ error: slugError }, { status: 400 });
  }

  const updated = await updateEpisode(episodeId, body);
  if (!updated) return Response.json({ error: "Episode not found" }, { status: 404 });

  return Response.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; sid: string; eid: string }> }) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eid } = await params;
  const episodeId = parseInt(eid);
  if (isNaN(episodeId)) return Response.json({ error: "Invalid ID" }, { status: 400 });

  await deleteEpisode(episodeId);
  return Response.json({ success: true });
}
