import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, applyRateLimit } from "@/lib/apiUtils";
import { projectSchema, sanitizeObject } from "@/lib/validation";

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
  const clientId = searchParams.get("clientId") || "";

  const sortField = searchParams.get("sortField") || "createdAt";
  const sortDirection = searchParams.get("sortDirection") || "desc";

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } }
      ]
    }),
    ...(status && { status: status as "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED" }),
    ...(clientId && { clientId })
  };

  const allowedSortFields = ["name", "status", "createdAt", "budget"];
  const orderField = allowedSortFields.includes(sortField) ? sortField : "createdAt";
  const orderDir = sortDirection === "asc" ? "asc" : "desc";

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        client: { select: { name: true } },
        manager: { select: { name: true } },
        _count: { select: { tasks: true, milestones: true, teamMembers: true } }
      },
      orderBy: { [orderField]: orderDir },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.project.count({ where })
  ]);

  return NextResponse.json({
    projects,
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

    const validation = projectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = sanitizeObject(validation.data as Record<string, unknown>);
    const userId = (auth.session!.user as { id: string }).id;

    const project = await prisma.project.create({
      data: {
        name: data.name as string,
        description: (data.description as string) || null,
        clientId: data.clientId as string,
        managerId: userId,
        status: (data.status as "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED") || "PLANNING",
        startDate: data.startDate ? new Date(data.startDate as string) : null,
        endDate: data.endDate ? new Date(data.endDate as string) : null,
        budget: data.budget ? Number(data.budget) : null
      }
    });

    await prisma.activity.create({
      data: {
        userId,
        action: "created a new project",
        entityType: "Project",
        entityId: project.id
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
