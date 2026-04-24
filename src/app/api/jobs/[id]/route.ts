import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, applyRateLimit } from "@/lib/apiUtils";
import { sanitizeObject } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await checkAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    const job = await prisma.jobPosition.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true,
              },
            },
          },
          orderBy: { appliedAt: "desc" },
        },
        placements: {
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            applications: true,
            placements: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await checkAuth();
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    const existing = await prisma.jobPosition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = sanitizeObject(body);

    const job = await prisma.jobPosition.update({
      where: { id },
      data: {
        title: data.title as string,
        description: (data.description as string) || null,
        requirements: (data.requirements as string[]) || [],
        skills: (data.skills as string[]) || [],
        location: (data.location as string) || null,
        salaryMin: data.salaryMin
          ? parseFloat(String(data.salaryMin))
          : null,
        salaryMax: data.salaryMax
          ? parseFloat(String(data.salaryMax))
          : null,
        type: data.type as
          | "FULL_TIME"
          | "PART_TIME"
          | "CONTRACT"
          | "TEMPORARY"
          | undefined,
        status: data.status as
          | "OPEN"
          | "CLOSED"
          | "ON_HOLD"
          | undefined,
      },
    });

    const userId = (auth.session!.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "updated job position",
        entityType: "JobPosition",
        entityId: job.id,
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await checkAuth("MANAGER");
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await params;

    const existing = await prisma.jobPosition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.jobPosition.delete({ where: { id } });

    const userId = (auth.session!.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "deleted a job position",
        entityType: "JobPosition",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
