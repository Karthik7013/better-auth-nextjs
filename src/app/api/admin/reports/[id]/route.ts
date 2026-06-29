import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { updateReportStatus, deleteReport } from "@/services/reports";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reportId = parseInt(id);
  if (isNaN(reportId)) {
    return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status } = body;
    if (!status || !["pending", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const result = await updateReportStatus(reportId, status);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json(result.report);
  } catch {
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCachedSession(request);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reportId = parseInt(id);
  if (isNaN(reportId)) {
    return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
  }

  try {
    const deleted = await deleteReport(reportId);
    if (!deleted) {
      return NextResponse.json({ error: "Report Not Found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}
