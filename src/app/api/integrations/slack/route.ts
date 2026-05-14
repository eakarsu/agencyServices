// Slack notifications via incoming webhook.
// Required env var: SLACK_WEBHOOK_URL
// Returns 503 if not configured.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json(
      {
        error: "Slack not configured",
        missing: "SLACK_WEBHOOK_URL",
        configure: "Add a Slack incoming webhook URL to enable notifications.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { message, channel } = body || {};
    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message, channel: channel || undefined }),
    });

    if (!resp.ok) {
      return NextResponse.json({ error: "Slack delivery failed", status: resp.status }, { status: 502 });
    }

    return NextResponse.json({ ok: true, provider: "slack" });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
