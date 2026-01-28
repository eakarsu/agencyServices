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
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } }
      ]
    }),
    ...(status && { status: status as "NEW" | "SCREENING" | "INTERVIEWING" | "OFFERED" | "PLACED" | "REJECTED" | "WITHDRAWN" })
  };

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where,
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { applications: true, interviews: true } }
      },
      orderBy: { createdAt: "desc" },
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
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const userId = (session.user as { id: string }).id;

    const candidate = await prisma.candidate.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        resumeUrl: data.resumeUrl,
        resumeText: data.resumeText,
        skills: data.skills || [],
        experience: data.experience ? parseInt(data.experience) : null,
        currentTitle: data.currentTitle,
        currentCompany: data.currentCompany,
        expectedSalary: data.expectedSalary ? parseFloat(data.expectedSalary) : null,
        location: data.location,
        status: data.status || "NEW",
        source: data.source,
        notes: data.notes,
        createdById: userId
      }
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Error creating candidate:", error);
    return NextResponse.json({ error: "Failed to create candidate" }, { status: 500 });
  }
}
