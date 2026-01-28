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
    const type = searchParams.get("type") || "";

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [commissions, total] = await Promise.all([
      prisma.commission.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.commission.count({ where })
    ]);

    return NextResponse.json({
      commissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch commissions" },
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

    const commission = await prisma.commission.create({
      data: {
        type: data.type,
        referenceId: data.referenceId,
        amount: parseFloat(data.amount),
        percentage: parseFloat(data.percentage),
        status: data.status || "PENDING",
        paidAt: data.paidAt ? new Date(data.paidAt) : null
      }
    });

    return NextResponse.json(commission, { status: 201 });
  } catch (error) {
    console.error("Error creating commission:", error);
    return NextResponse.json(
      { error: "Failed to create commission" },
      { status: 500 }
    );
  }
}
