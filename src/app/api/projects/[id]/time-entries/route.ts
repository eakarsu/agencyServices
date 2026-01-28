import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const timeEntries = await prisma.timeEntry.findMany({
    where: { projectId: id },
    include: {
      user: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } }
    },
    orderBy: { date: "desc" }
  });

  return NextResponse.json(timeEntries);
}

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
    const userId = (session.user as { id: string }).id;

    const timeEntry = await prisma.timeEntry.create({
      data: {
        projectId: id,
        taskId: data.taskId || null,
        userId,
        hours: parseFloat(data.hours),
        description: data.description,
        date: new Date(data.date),
        billable: data.billable !== false
      },
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } }
      }
    });

    return NextResponse.json(timeEntry);
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 });
  }
}
