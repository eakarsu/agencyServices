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

    const followUp = await prisma.followUp.create({
      data: {
        leadId: id,
        type: data.type,
        scheduledAt: new Date(data.scheduledAt),
        notes: data.notes
      }
    });

    // Update lead status if not already contacted
    await prisma.lead.update({
      where: { id, status: "NEW" },
      data: { status: "CONTACTED" }
    });

    return NextResponse.json(followUp);
  } catch (error) {
    console.error("Error creating follow-up:", error);
    return NextResponse.json({ error: "Failed to create follow-up" }, { status: 500 });
  }
}
