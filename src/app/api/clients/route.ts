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
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { company: { contains: search, mode: "insensitive" as const } }
      ]
    }),
    ...(status && { status: status as "ACTIVE" | "INACTIVE" | "PROSPECT" | "CHURNED" })
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        createdBy: { select: { name: true } },
        projects: { select: { id: true } },
        _count: { select: { projects: true, invoices: true } }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.client.count({ where })
  ]);

  return NextResponse.json({
    clients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
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

    const client = await prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        website: data.website,
        address: data.address,
        industry: data.industry,
        status: data.status || "ACTIVE",
        notes: data.notes,
        createdById: userId
      }
    });

    await prisma.activity.create({
      data: {
        userId,
        action: "created a new client",
        entityType: "Client",
        entityId: client.id
      }
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
