import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { listAdminRequests } from "@/services/requests";

export async function GET(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";

  try {
    const result = await listAdminRequests({ page, limit, status, search });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}
