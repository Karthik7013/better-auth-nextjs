import { NextRequest } from "next/server";
import { getCachedSession } from "@/lib/session";
import { createSeries, listAdminSeries } from "@/services/series";
import { validateSlug } from "@/lib/validation";
import { parseAdminListParams } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, search, sortBy, sortDir, columnFilters } = parseAdminListParams(searchParams);
  const result = await listAdminSeries({ page, limit, search, sortBy, sortDir, columnFilters });
  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, slug } = body;

  if (!title || !slug) {
    return Response.json({ error: "Title and slug are required" }, { status: 400 });
  }

  const slugError = validateSlug(slug);
  if (slugError) {
    return Response.json({ error: slugError }, { status: 400 });
  }

  try {
    const created = await createSeries(body);
    return Response.json(created, { status: 201 });
  } catch (err: any) {
    if (err?.message?.includes("duplicate key")) {
      return Response.json({ error: "Slug already exists" }, { status: 409 });
    }
    throw err;
  }
}
