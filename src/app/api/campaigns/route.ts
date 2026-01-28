import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where = {
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    ...(status && { status: status as "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "COMPLETED" })
  };

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        client: { select: { name: true } },
        manager: { select: { name: true } },
        _count: { select: { channels: true, metrics: true, abTests: true } }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.campaign.count({ where })
  ]);

  return NextResponse.json({
    campaigns,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const userId = (session.user as { id: string }).id;

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        managerId: data.managerId || userId,
        status: data.status || "DRAFT",
        type: data.type,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget ? parseFloat(data.budget) : null
      }
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
