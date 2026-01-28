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

  const communications = await prisma.communication.findMany({
    where: { clientId: id },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(communications);
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

    const communication = await prisma.communication.create({
      data: {
        clientId: id,
        userId,
        type: data.type,
        subject: data.subject,
        content: data.content
      },
      include: { user: { select: { name: true } } }
    });

    return NextResponse.json(communication);
  } catch (error) {
    console.error("Error creating communication:", error);
    return NextResponse.json({ error: "Failed to create communication" }, { status: 500 });
  }
}
