import { NextRequest } from "next/server";
import { getCachedSession } from "@/lib/session";
import { db } from "@/db";
import { seasons } from "@/db/schema";
import { eq, asc, count } from "drizzle-orm";
import { createSeason } from "@/services/series";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const seriesId = parseInt(id);
  if (isNaN(seriesId)) return Response.json({ error: "Invalid ID" }, { status: 400 });

  const seasonRows = await db
    .select()
    .from(seasons)
    .where(eq(seasons.seriesId, seriesId))
    .orderBy(asc(seasons.seasonNumber));

  const episodeCounts = await db
    .select({ seasonId: seasons.id, value: count() })
    .from(seasons)
    .leftJoin(episodes, eq(episodes.seasonId, seasons.id))
    .where(eq(seasons.seriesId, seriesId))
    .groupBy(seasons.id);

  const countMap: Record<number, number> = {};
  for (const row of episodeCounts) countMap[row.seasonId] = Number(row.value);

  const seasonsWithCounts = seasonRows.map((s) => ({
    ...s,
    episodeCount: countMap[s.id] || 0,
  }));

  return Response.json({ seasons: seasonsWithCounts });
}

import { episodes } from "@/db/schema";

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
