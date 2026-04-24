import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, applyRateLimit } from "@/lib/apiUtils";
import { campaignSchema, sanitizeObject } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await checkAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const sortField = searchParams.get("sortField") || "createdAt";
  const sortDirection = searchParams.get("sortDirection") || "desc";

  const where = {
    ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    ...(status && { status: status as "DRAFT" | "SCHEDULED" | "ACTIVE" | "PAUSED" | "COMPLETED" })
  };

  const allowedSortFields = ["name", "status", "type", "budget", "createdAt"];
  const orderField = allowedSortFields.includes(sortField) ? sortField : "createdAt";
  const orderDir = sortDirection === "asc" ? "asc" : "desc";

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: {
        client: { select: { name: true } },
        manager: { select: { name: true } },
        _count: { select: { channels: true, metrics: true, abTests: true } }
      },
      orderBy: { [orderField]: orderDir },
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
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await checkAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();

    const validation = campaignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = sanitizeObject(validation.data as Record<string, unknown>);
    const userId = (auth.session!.user as { id: string }).id;

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name as string,
        description: (data.description as string) || null,
        clientId: data.clientId as string,
        managerId: userId,
        status: "DRAFT",
        type: data.type as "EMAIL" | "SOCIAL" | "PPC" | "CONTENT" | "SEO" | "MULTI_CHANNEL",
        startDate: data.startDate ? new Date(data.startDate as string) : null,
        endDate: data.endDate ? new Date(data.endDate as string) : null,
        budget: data.budget ? Number(data.budget) : null
      }
    });

    await prisma.activity.create({
      data: {
        userId,
        action: "created a new campaign",
        entityType: "Campaign",
        entityId: campaign.id
      }
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
