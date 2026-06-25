import { NextRequest, NextResponse } from "next/server";
import { getCachedSession } from "@/lib/session";
import { createRequest } from "@/services/requests";

export async function POST(request: NextRequest) {
  const session = await getCachedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "admin") {
    return NextResponse.json({ error: "Admins cannot request movies" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, externalLink } = body;

    const result = await createRequest({ userId: session.user.id, title, description, externalLink });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.request, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
