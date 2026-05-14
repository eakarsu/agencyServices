// Indeed job posting integration.
// Required env vars: INDEED_PUBLISHER_ID, INDEED_API_KEY
// Returns 503 if not configured.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publisherId = process.env.INDEED_PUBLISHER_ID;
  const apiKey = process.env.INDEED_API_KEY;

  if (!publisherId || !apiKey) {
    return NextResponse.json(
      {
        error: "Indeed not configured",
        missing: "INDEED_PUBLISHER_ID, INDEED_API_KEY",
        configure: "Set these env vars to enable Indeed job posting.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { jobTitle, jobDescription, location } = body || {};

    if (!jobTitle || !jobDescription) {
      return NextResponse.json({ error: "jobTitle and jobDescription required" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      provider: "indeed",
      job: { title: jobTitle, description: jobDescription, location: location || "Remote" },
      simulated: true,
      note: "Indeed API call would be made here in production.",
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
