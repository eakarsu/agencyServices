// Predictive placement-success scoring from historical placements. v0 uses
// a hand-tuned weighted feature score; future versions would train a logistic
// regression or gradient-boosted model on past placement outcomes.
// TODO: extract features from Prisma history; train and persist a model.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Inputs = {
  candidate: {
    yearsExperience?: number;
    matchScore?: number; // 0..1 (from candidate-match-vector)
    interviewedBefore?: boolean;
    locationMatch?: boolean;
  };
  client: {
    placementsLast12Months?: number;
    averageTimeToFillDays?: number;
  };
  role: {
    seniority?: "junior" | "mid" | "senior" | "exec";
    salaryFitScore?: number; // 0..1
  };
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function score(i: Inputs): { probability: number; band: string; explanation: string[] } {
  const explanation: string[] = [];
  let s = 0.5;

  if (typeof i.candidate.matchScore === "number") {
    s += (i.candidate.matchScore - 0.5) * 0.3;
    explanation.push(`Match score contribution: ${(i.candidate.matchScore - 0.5).toFixed(2)} * 0.3`);
  }
  if (typeof i.candidate.yearsExperience === "number") {
    const seniority = i.role.seniority || "mid";
    const target = { junior: 1, mid: 4, senior: 8, exec: 15 }[seniority];
    const diff = Math.abs((i.candidate.yearsExperience || 0) - target);
    s -= clamp(diff / 20, 0, 0.2);
    explanation.push(`Experience gap penalty: -${clamp(diff / 20, 0, 0.2).toFixed(2)}`);
  }
  if (i.candidate.interviewedBefore) {
    s += 0.05;
    explanation.push("Prior interview boost: +0.05");
  }
  if (i.candidate.locationMatch) {
    s += 0.05;
    explanation.push("Location match boost: +0.05");
  }
  if (typeof i.role.salaryFitScore === "number") {
    s += (i.role.salaryFitScore - 0.5) * 0.15;
    explanation.push(`Salary fit contribution: ${((i.role.salaryFitScore - 0.5) * 0.15).toFixed(2)}`);
  }
  if (typeof i.client.placementsLast12Months === "number") {
    const cap = Math.min(i.client.placementsLast12Months / 50, 0.1);
    s += cap;
    explanation.push(`Client engagement boost: +${cap.toFixed(2)}`);
  }

  s = clamp(s, 0.02, 0.98);
  const band = s >= 0.75 ? "high" : s >= 0.5 ? "medium" : s >= 0.3 ? "low" : "very_low";
  return { probability: Math.round(s * 1000) / 1000, band, explanation };
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as Inputs;
    if (!body || !body.candidate || !body.client || !body.role) {
      return NextResponse.json({ error: "candidate, client, role required" }, { status: 400 });
    }
    return NextResponse.json({
      ...score(body),
      model: "weighted_heuristic_v0",
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
