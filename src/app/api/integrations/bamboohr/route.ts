// BambooHR ATS webhook integration.
// Required env vars: BAMBOOHR_API_KEY, BAMBOOHR_SUBDOMAIN
// Returns 503 if not configured.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.BAMBOOHR_API_KEY;
  const subdomain = process.env.BAMBOOHR_SUBDOMAIN;
  if (!apiKey || !subdomain) {
    return NextResponse.json(
      {
        error: "BambooHR not configured",
        missing: "BAMBOOHR_API_KEY, BAMBOOHR_SUBDOMAIN",
        configure: "Set these env vars to enable BambooHR ATS sync.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { event, payload } = body || {};
    if (!event) {
      return NextResponse.json({ error: "event required" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      provider: "bamboohr",
      event,
      payload,
      simulated: true,
      note: "BambooHR API call would be made here in production.",
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
