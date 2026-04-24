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
        { email: { contains: search, mode: "insensitive" as const } }
      ]
    }),
    ...(status && { status: status as "NEW" | "SCREENING" | "INTERVIEWING" | "OFFERED" | "PLACED" | "REJECTED" | "WITHDRAWN" })
  };

  const allowedSortFields = ["firstName", "lastName", "status", "score", "experience", "createdAt"];
  const orderField = allowedSortFields.includes(sortField) ? sortField : "createdAt";
  const orderDir = sortDirection === "asc" ? "asc" : "desc";

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { applications: true, interviews: true } }
      },
      orderBy: { [orderField]: orderDir },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.candidate.count({ where })
  ]);

  return NextResponse.json({
    candidates,
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
    const data = sanitizeObject(body);
    const userId = (auth.session!.user as { id: string }).id;

    const candidate = await prisma.candidate.create({
      data: {
        firstName: data.firstName as string,
        lastName: data.lastName as string,
        email: data.email as string,
        phone: (data.phone as string) || null,
        resumeUrl: (data.resumeUrl as string) || null,
        resumeText: (data.resumeText as string) || null,
        skills: (data.skills as string[]) || [],
        experience: data.experience ? parseInt(String(data.experience)) : null,
        currentTitle: (data.currentTitle as string) || null,
        currentCompany: (data.currentCompany as string) || null,
        expectedSalary: data.expectedSalary ? parseFloat(String(data.expectedSalary)) : null,
        location: (data.location as string) || null,
        status: (data.status as string as "NEW" | "SCREENING" | "INTERVIEWING" | "OFFERED" | "PLACED" | "REJECTED" | "WITHDRAWN") || "NEW",
        source: (data.source as string) || null,
        notes: (data.notes as string) || null,
        createdById: userId
      }
    });

    await prisma.activity.create({
      data: {
        userId,
        action: "added a new candidate",
        entityType: "Candidate",
        entityId: candidate.id
      }
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Error creating candidate:", error);
    return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 });
  }
}
