// LinkedIn job posting integration.
// Required env vars: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ACCESS_TOKEN
// Returns 503 if not configured. When configured, it would POST to
// https://api.linkedin.com/v2/jobs (org id required).
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!accessToken || !clientId || !clientSecret) {
    return NextResponse.json(
      {
        error: "LinkedIn not configured",
        missing: "LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ACCESS_TOKEN",
        configure: "Set these env vars to enable LinkedIn job posting.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { jobTitle, jobDescription } = body || {};

    if (!jobTitle || !jobDescription) {
      return NextResponse.json({ error: "jobTitle and jobDescription required" }, { status: 400 });
    }

    // Real implementation would call LinkedIn jobs API. We just return a stub
    // confirmation so the UI can verify a configured path.
    return NextResponse.json({
      ok: true,
      provider: "linkedin",
      job: { title: jobTitle, description: jobDescription },
      simulated: true,
      note: "LinkedIn API call would be made here in production.",
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
