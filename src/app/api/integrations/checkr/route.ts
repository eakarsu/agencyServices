// Background check integration via Checkr.
// Required env var: CHECKR_API_KEY
// Returns 503 if not configured. Real impl would POST to https://api.checkr.com/v1/candidates
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.CHECKR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Checkr not configured",
        missing: "CHECKR_API_KEY",
        configure: "Set CHECKR_API_KEY to enable background checks.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { candidateId, firstName, lastName, email } = body || {};
    if (!candidateId || !firstName || !lastName || !email) {
      return NextResponse.json({ error: "candidateId, firstName, lastName, email required" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      provider: "checkr",
      candidate: { id: candidateId, firstName, lastName, email },
      report: { status: "pending", simulated: true },
      note: "Checkr API call would be made here in production.",
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
