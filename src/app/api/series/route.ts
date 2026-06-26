import { NextRequest } from "next/server";
import { getCachedSession } from "@/lib/session";
import { listSeries } from "@/services/series";
import { cacheGetOrSet } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const tagsParam = searchParams.get("tags") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");
  const sortBy = searchParams.get("sortBy") || undefined;
  const sortDir = (searchParams.get("sortDir") as "asc" | "desc") || undefined;

  if (!q && !tagsParam && page === 1 && limit === 12 && !sortBy && !sortDir) {
    const cached = await cacheGetOrSet(
      "series-list:default",
      300,
      () => listSeries({ page, limit })
    );
    return Response.json(cached);
  }

  const result = await listSeries({ q, tagsParam, page, limit, sortBy, sortDir });
  return Response.json(result);
}
