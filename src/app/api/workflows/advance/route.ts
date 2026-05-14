// Workflow automation: candidate pipeline auto-advance rules engine.
// PRODUCT-DECISION: Pipeline stages are
//   applied -> screening -> interview -> offer -> hired
// Auto-advance triggers:
//   - score >= 0.75 advances applied -> screening
//   - score >= 0.85 + recruiterApproval=true advances screening -> interview
//   - interviewPassed=true advances interview -> offer
//   - offerAccepted=true advances offer -> hired
// Override thresholds via env vars WORKFLOW_SCREEN_THRESHOLD, WORKFLOW_INTERVIEW_THRESHOLD.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const STAGES = ["applied", "screening", "interview", "offer", "hired"] as const;
type Stage = (typeof STAGES)[number];

const SCREEN_THRESHOLD = Number(process.env.WORKFLOW_SCREEN_THRESHOLD || "0.75");
const INTERVIEW_THRESHOLD = Number(process.env.WORKFLOW_INTERVIEW_THRESHOLD || "0.85");

function next(stage: Stage, signals: any): { stage: Stage; reason: string } {
  switch (stage) {
    case "applied":
      if ((signals.score ?? 0) >= SCREEN_THRESHOLD) {
        return { stage: "screening", reason: `score>=${SCREEN_THRESHOLD}` };
      }
      return { stage, reason: "below screen threshold" };
    case "screening":
      if ((signals.score ?? 0) >= INTERVIEW_THRESHOLD && signals.recruiterApproval) {
        return { stage: "interview", reason: `score>=${INTERVIEW_THRESHOLD} & recruiter approved` };
      }
      return { stage, reason: "awaiting recruiter approval or higher score" };
    case "interview":
      if (signals.interviewPassed) return { stage: "offer", reason: "interview passed" };
      return { stage, reason: "interview not yet passed" };
    case "offer":
      if (signals.offerAccepted) return { stage: "hired", reason: "offer accepted" };
      return { stage, reason: "offer pending" };
    case "hired":
    default:
      return { stage, reason: "terminal stage" };
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { stage, signals } = await request.json();
    if (!stage || !STAGES.includes(stage)) {
      return NextResponse.json({ error: `stage must be one of ${STAGES.join(", ")}` }, { status: 400 });
    }
    const result = next(stage as Stage, signals || {});
    return NextResponse.json({ from: stage, ...result });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
