import { NextRequest } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { episodes } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { createEpisode, validateSlug } from "@/services/series";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; sid: string }> }) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sid } = await params;
  const seasonId = parseInt(sid);
  if (isNaN(seasonId)) return Response.json({ error: "Invalid ID" }, { status: 400 });

  const episodeRows = await db
    .select()
    .from(episodes)
    .where(eq(episodes.seasonId, seasonId))
    .orderBy(asc(episodes.episodeNumber));

  return Response.json({ episodes: episodeRows });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; sid: string }> }) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sid } = await params;
  const seasonId = parseInt(sid);
  if (isNaN(seasonId)) return Response.json({ error: "Invalid ID" }, { status: 400 });

  const body = await request.json();
  if (!body.title || !body.slug) {
    return Response.json({ error: "Title and slug are required" }, { status: 400 });
  }

  const slugError = validateSlug(body.slug);
  if (slugError) return Response.json({ error: slugError }, { status: 400 });

  const created = await createEpisode(seasonId, body);
  return Response.json(created, { status: 201 });
}
