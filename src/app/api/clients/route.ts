import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, applyRateLimit } from "@/lib/apiUtils";
import { clientSchema, sanitizeObject } from "@/lib/validation";

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
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { company: { contains: search, mode: "insensitive" as const } }
      ]
    }),
    ...(status && { status: status as "ACTIVE" | "INACTIVE" | "PROSPECT" | "CHURNED" })
  };

  const allowedSortFields = ["name", "email", "company", "status", "createdAt"];
  const orderField = allowedSortFields.includes(sortField) ? sortField : "createdAt";
  const orderDir = sortDirection === "asc" ? "asc" : "desc";

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        createdBy: { select: { name: true } },
        projects: { select: { id: true } },
        _count: { select: { projects: true, invoices: true } }
      },
      orderBy: { [orderField]: orderDir },
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
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await checkAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = clientSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Sanitize input
    const data = sanitizeObject(validation.data as Record<string, unknown>);
    const userId = (auth.session!.user as { id: string }).id;

    const client = await prisma.client.create({
      data: {
        name: data.name as string,
        email: data.email as string,
        phone: (data.phone as string) || null,
        company: (data.company as string) || null,
        website: (data.website as string) || null,
        address: (data.address as string) || null,
        industry: (data.industry as string) || null,
        status: (data.status as "ACTIVE" | "INACTIVE" | "PROSPECT" | "CHURNED") || "ACTIVE",
        notes: (data.notes as string) || null,
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
