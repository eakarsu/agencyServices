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

  const contracts = await prisma.contract.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(contracts);
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

    const contract = await prisma.contract.create({
      data: {
        clientId: id,
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        value: parseFloat(data.value),
        status: data.status || "DRAFT",
        documentUrl: data.documentUrl
      }
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
  }
}
