import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { deleteAccount } from "@/services/users";

export async function DELETE(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteAccount(session.user.id, request.headers);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete Failed" }, { status: 500 });
  }
}
