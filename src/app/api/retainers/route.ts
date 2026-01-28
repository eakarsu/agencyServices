import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "";
    const clientId = searchParams.get("clientId") || "";

    const where: any = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const [retainers, total] = await Promise.all([
      prisma.retainer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.retainer.count({ where })
    ]);

    return NextResponse.json({
      retainers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching retainers:", error);
    return NextResponse.json(
      { error: "Failed to fetch retainers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    const retainer = await prisma.retainer.create({
      data: {
        clientId: data.clientId,
        amount: parseFloat(data.amount),
        frequency: data.frequency,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || "ACTIVE"
      }
    });

    return NextResponse.json(retainer, { status: 201 });
  } catch (error) {
    console.error("Error creating retainer:", error);
    return NextResponse.json(
      { error: "Failed to create retainer" },
      { status: 500 }
    );
  }
}
