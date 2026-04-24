import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, applyRateLimit } from "@/lib/apiUtils";
import { leadSchema, sanitizeObject } from "@/lib/validation";

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
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { company: { contains: search, mode: "insensitive" as const } }
      ]
    }),
    ...(status && { status: status as "NEW" | "CONTACTED" | "QUALIFIED" | "UNQUALIFIED" | "CONVERTED" | "LOST" })
  };

  const allowedSortFields = ["firstName", "lastName", "company", "status", "score", "source", "createdAt"];
  const orderField = allowedSortFields.includes(sortField) ? sortField : "createdAt";
  const orderDir = sortDirection === "asc" ? "asc" : "desc";

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        assignedTo: { select: { name: true } },
        client: { select: { name: true } },
        _count: { select: { followUps: true } }
      },
      orderBy: { [orderField]: orderDir },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.lead.count({ where })
  ]);

  return NextResponse.json({
    leads,
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

    const validation = leadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = sanitizeObject(validation.data as Record<string, unknown>);
    const userId = (auth.session!.user as { id: string }).id;

    const lead = await prisma.lead.create({
      data: {
        firstName: data.firstName as string,
        lastName: data.lastName as string,
        email: data.email as string,
        phone: (data.phone as string) || null,
        company: (data.company as string) || null,
        title: (data.title as string) || null,
        source: data.source as "WEBSITE" | "REFERRAL" | "COLD_CALL" | "EMAIL_CAMPAIGN" | "SOCIAL_MEDIA" | "AD_CAMPAIGN" | "EVENT" | "OTHER",
        status: "NEW",
        score: 0,
        notes: (data.notes as string) || null,
        assignedToId: userId,
      }
    });

    await prisma.activity.create({
      data: {
        userId,
        action: "added a new lead",
        entityType: "Lead",
        entityId: lead.id
      }
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
