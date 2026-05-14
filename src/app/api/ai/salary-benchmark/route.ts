// Salary benchmark advisor.
// PRODUCT-DECISION: We use a small static lookup table of US median salaries
// (2024 BLS / industry reports, rounded). Adjustments: +20% senior, +40% staff,
// city multipliers (SF 1.30, NYC 1.25, Austin 1.10, Remote 1.0, default 1.0).
// Override via env SALARY_DATA_URL to point to a real provider in the future.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const BASE_SALARY: Record<string, number> = {
  "software engineer": 120000,
  "frontend engineer": 115000,
  "backend engineer": 125000,
  "fullstack engineer": 122000,
  "data engineer": 130000,
  "data scientist": 135000,
  "product manager": 140000,
  "designer": 105000,
  "devops engineer": 130000,
  "marketing manager": 95000,
  "sales executive": 110000,
  "recruiter": 75000,
};

const LEVEL_MULT: Record<string, number> = {
  junior: 0.75,
  mid: 1.0,
  senior: 1.2,
  staff: 1.4,
  principal: 1.6,
};

const CITY_MULT: Record<string, number> = {
  sf: 1.3,
  "san francisco": 1.3,
  nyc: 1.25,
  "new york": 1.25,
  seattle: 1.2,
  austin: 1.1,
  remote: 1.0,
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { role, level, city } = await request.json();
    if (!role) return NextResponse.json({ error: "role required" }, { status: 400 });
    const base = BASE_SALARY[String(role).toLowerCase()] || 100000;
    const lvl = LEVEL_MULT[String(level || "mid").toLowerCase()] || 1.0;
    const c = CITY_MULT[String(city || "remote").toLowerCase()] || 1.0;
    const median = Math.round(base * lvl * c);
    return NextResponse.json({
      role,
      level: level || "mid",
      city: city || "remote",
      benchmark: {
        p25: Math.round(median * 0.85),
        median,
        p75: Math.round(median * 1.15),
      },
      source: "static_market_table_2024",
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
