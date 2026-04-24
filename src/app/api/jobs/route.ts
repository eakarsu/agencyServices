import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, applyRateLimit } from "@/lib/apiUtils";
import { sanitizeObject } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await checkAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";

    const search = searchParams.get("search") || "";
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") || "desc";

    const where = {
      ...(status && { status: status as "OPEN" | "CLOSED" | "ON_HOLD" }),
      ...(type && { type: type as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "TEMPORARY" }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { location: { contains: search, mode: "insensitive" as const } },
        ]
      })
    };

    const allowedSortFields = ["title", "status", "type", "createdAt", "salaryMin"];
    const orderField = allowedSortFields.includes(sortField) ? sortField : "createdAt";
    const orderDir = sortDirection === "asc" ? "asc" : "desc";

    const [jobs, total] = await Promise.all([
      prisma.jobPosition.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [orderField]: orderDir },
        include: {
          _count: {
            select: { applications: true, placements: true }
          }
        }
      }),
      prisma.jobPosition.count({ where })
    ]);

    return NextResponse.json({
      jobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
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
    const data = sanitizeObject(body);
    const userId = (auth.session!.user as { id: string }).id;

    const job = await prisma.jobPosition.create({
      data: {
        title: data.title as string,
        description: (data.description as string) || null,
        requirements: (data.requirements as string[]) || [],
        skills: (data.skills as string[]) || [],
        location: (data.location as string) || null,
        salaryMin: data.salaryMin ? parseFloat(String(data.salaryMin)) : null,
        salaryMax: data.salaryMax ? parseFloat(String(data.salaryMax)) : null,
        type: (data.type as "FULL_TIME" | "PART_TIME" | "CONTRACT" | "TEMPORARY") || "FULL_TIME",
        status: (data.status as "OPEN" | "CLOSED" | "ON_HOLD") || "OPEN"
      }
    });

    await prisma.activity.create({
      data: {
        userId,
        action: "posted a new job",
        entityType: "JobPosition",
        entityId: job.id
      }
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
