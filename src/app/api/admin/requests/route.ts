import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { listAdminRequests } from "@/services/requests";
import { parsePagination, extractColumnFilters } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const { page, limit, search, sortBy, sortDir } = parsePagination(searchParams);
  const status = searchParams.get("status");
  const columnFilters = extractColumnFilters(searchParams, ["status"]);

  try {
    const result = await listAdminRequests({ page, limit, status, search, sortBy, sortDir, columnFilters });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" }
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}
