// Agentic interview coordinator: schedules, sends reminders, and captures
// post-call summaries. v0 scaffold returns a structured proposed plan.
// TODO: wire calendar (Google/Outlook) + SMS/email providers, plus LLM for
// post-call summarization.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Action = "schedule" | "remind" | "summarize";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const action: Action = body.action;
    if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

    if (action === "schedule") {
      const { candidateId, interviewers, durationMinutes = 60, windowDays = 7 } = body;
      if (!candidateId || !Array.isArray(interviewers)) {
        return NextResponse.json({ error: "candidateId and interviewers[] required" }, { status: 400 });
      }
      // v0: produce candidate slots from now to windowDays out (business hours)
      const slots: { startISO: string; endISO: string }[] = [];
      const now = new Date();
      for (let d = 1; d <= windowDays && slots.length < 5; d++) {
        const day = new Date(now);
        day.setDate(day.getDate() + d);
        for (const hour of [10, 14, 16]) {
          const start = new Date(day);
          start.setHours(hour, 0, 0, 0);
          const end = new Date(start.getTime() + durationMinutes * 60_000);
          slots.push({ startISO: start.toISOString(), endISO: end.toISOString() });
          if (slots.length >= 5) break;
        }
      }
      return NextResponse.json({
        candidateId,
        interviewers,
        proposedSlots: slots,
        nextStep: "send_invites",
        // TODO: integrate Google Calendar createEvent + email invites
      });
    }

    if (action === "remind") {
      const { interviewId, leadTimeMinutes = 60 } = body;
      if (!interviewId) return NextResponse.json({ error: "interviewId required" }, { status: 400 });
      // TODO: queue reminder via SMS/email provider (Twilio, SendGrid)
      return NextResponse.json({
        interviewId,
        scheduledReminderMinutesBefore: leadTimeMinutes,
        channel: "email+sms",
        status: "queued_v0",
      });
    }

    if (action === "summarize") {
      const { transcript } = body;
      if (!transcript) return NextResponse.json({ error: "transcript required" }, { status: 400 });
      // TODO: call LLM (OpenRouter / OpenAI) with summarization prompt
      const wordCount = String(transcript).split(/\s+/).length;
      return NextResponse.json({
        summary: `Interview transcript captured (${wordCount} words). Detailed AI summary pending LLM integration.`,
        actionItems: [],
        recommendedDecision: "pending",
        model: "placeholder_v0",
      });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
