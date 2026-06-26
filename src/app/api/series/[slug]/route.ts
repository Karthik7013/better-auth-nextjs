import { NextRequest } from "next/server";
import { getCachedSession } from "@/lib/session";
import { getSeriesBySlug } from "@/services/series";
import { cacheGetOrSet } from "@/lib/cache";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getCachedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;

  const result = await cacheGetOrSet(
    `series:${slug}`,
    300,
    () => getSeriesBySlug(slug)
  );

  if (!result) return Response.json({ error: "Series not found" }, { status: 404 });

  return Response.json(result);
}
