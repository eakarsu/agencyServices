import { NextResponse } from "next/server";

const guarantees = [
  { id: "PG-501", candidate: "Sam Rivera", client: "Atlas Media", guaranteeDays: 90, daysRemaining: 22, status: "active" },
  { id: "PG-502", candidate: "Priya Mehta", client: "Northstar", guaranteeDays: 60, daysRemaining: 5, status: "watch" },
  { id: "PG-503", candidate: "Leon Park", client: "Civic Labs", guaranteeDays: 90, daysRemaining: 0, status: "expired" },
];

export async function GET() {
  return NextResponse.json({
    summary: {
      guarantees: guarantees.length,
      watch: guarantees.filter((item) => item.status === "watch").length,
      activeExposure: guarantees.filter((item) => item.status !== "expired").length,
    },
    guarantees,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const item = guarantees.find((entry) => entry.id === body.id) || guarantees[0];
  return NextResponse.json({
    id: item.id,
    action: item.status === "watch" ? "schedule client health check and replacement slate" : "continue guarantee monitoring",
    notes: ["confirm start date", "review contract clause", "notify account owner"],
  });
}
