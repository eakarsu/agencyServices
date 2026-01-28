import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await request.json();

    const interview = await prisma.interview.create({
      data: {
        candidateId: id,
        scheduledAt: new Date(data.scheduledAt),
        duration: parseInt(data.duration) || 60,
        type: data.type,
        location: data.location,
        notes: data.notes,
        status: "SCHEDULED"
      }
    });

    // Update candidate status
    await prisma.candidate.update({
      where: { id },
      data: { status: "INTERVIEWING" }
    });

    return NextResponse.json(interview);
  } catch (error) {
    console.error("Error scheduling interview:", error);
    return NextResponse.json({ error: "Failed to schedule interview" }, { status: 500 });
  }
}
