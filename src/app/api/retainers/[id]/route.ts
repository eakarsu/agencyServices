import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    const retainer = await prisma.retainer.findUnique({
      where: { id }
    });

    if (!retainer) {
      return NextResponse.json({ error: "Retainer not found" }, { status: 404 });
    }

    return NextResponse.json(retainer);
  } catch (error) {
    console.error("Error fetching retainer:", error);
    return NextResponse.json(
      { error: "Failed to fetch retainer" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const data = await request.json();

    const retainer = await prisma.retainer.update({
      where: { id },
      data: {
        amount: parseFloat(data.amount),
        frequency: data.frequency,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status
      }
    });

    return NextResponse.json(retainer);
  } catch (error) {
    console.error("Error updating retainer:", error);
    return NextResponse.json(
      { error: "Failed to update retainer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    await prisma.retainer.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting retainer:", error);
    return NextResponse.json(
      { error: "Failed to delete retainer" },
      { status: 500 }
    );
  }
}
