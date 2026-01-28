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

    const commission = await prisma.commission.findUnique({
      where: { id }
    });

    if (!commission) {
      return NextResponse.json({ error: "Commission not found" }, { status: 404 });
    }

    return NextResponse.json(commission);
  } catch (error) {
    console.error("Error fetching commission:", error);
    return NextResponse.json(
      { error: "Failed to fetch commission" },
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

    const commission = await prisma.commission.update({
      where: { id },
      data: {
        type: data.type,
        referenceId: data.referenceId,
        amount: parseFloat(data.amount),
        percentage: parseFloat(data.percentage),
        status: data.status,
        paidAt: data.paidAt ? new Date(data.paidAt) : null
      }
    });

    return NextResponse.json(commission);
  } catch (error) {
    console.error("Error updating commission:", error);
    return NextResponse.json(
      { error: "Failed to update commission" },
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

    await prisma.commission.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting commission:", error);
    return NextResponse.json(
      { error: "Failed to delete commission" },
      { status: 500 }
    );
  }
}
