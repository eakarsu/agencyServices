// ATS / job-board webhook bridge for BambooHR, Lever, Workday + Slack
// notifications. Accepts inbound webhook events, normalizes them, and (in v0)
// returns the canonical event; in production it would persist + fan-out.
// TODO: configure credentials for each provider in env, persist to Prisma,
// and push to Slack via SLACK_WEBHOOK_URL.
import { NextRequest, NextResponse } from "next/server";

type SupportedProvider = "bamboohr" | "lever" | "workday" | "greenhouse";

const PROVIDER_SECRET_ENV: Record<SupportedProvider, string> = {
  bamboohr: "BAMBOOHR_WEBHOOK_SECRET",
  lever: "LEVER_WEBHOOK_SECRET",
  workday: "WORKDAY_WEBHOOK_SECRET",
  greenhouse: "GREENHOUSE_WEBHOOK_SECRET",
};

function normalize(provider: SupportedProvider, body: any) {
  if (provider === "lever") {
    return {
      candidate: body.data?.candidate?.name || body.data?.candidateId,
      event: body.event,
      opportunityId: body.data?.opportunityId,
    };
  }
  if (provider === "bamboohr") {
    return {
      candidate: body.applicant?.fullName,
      event: body.action,
      jobId: body.job?.id,
    };
  }
  if (provider === "greenhouse") {
    return {
      candidate: body.payload?.application?.candidate?.first_name,
      event: body.action,
      jobId: body.payload?.application?.jobs?.[0]?.id,
    };
  }
  return { raw: body };
}

async function notifySlack(message: string) {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return { slack: "not_configured" };
  try {
    // TODO: configure credentials
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
    return { slack: res.ok ? "delivered" : `error_${res.status}` };
  } catch (e: any) {
    return { slack: `error_${e?.message || "unknown"}` };
  }
}

export async function POST(request: NextRequest) {
  const provider = (request.nextUrl.searchParams.get("provider") || "").toLowerCase() as SupportedProvider;
  if (!provider || !(provider in PROVIDER_SECRET_ENV)) {
    return NextResponse.json(
      { error: "provider query param must be one of bamboohr|lever|workday|greenhouse" },
      { status: 400 }
    );
  }

  // Optional shared-secret check
  const expected = process.env[PROVIDER_SECRET_ENV[provider]];
  const got = request.headers.get("x-webhook-secret");
  if (expected && got !== expected) {
    return NextResponse.json({ error: "invalid webhook secret" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const normalized = normalize(provider, body);
  // TODO: persist to Prisma (e.g., AtsEvent model)
  const slack = await notifySlack(`[${provider}] ${normalized.event || "event"}: ${normalized.candidate || "(unknown)"}`);

  return NextResponse.json({
    provider,
    normalized,
    ...slack,
    storage: "not_persisted_v0",
  });
}

export async function GET() {
  return NextResponse.json({
    supportedProviders: Object.keys(PROVIDER_SECRET_ENV),
    usage: "POST ?provider=lever with x-webhook-secret header",
  });
}
