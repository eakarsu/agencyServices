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

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        applications: {
          include: { job: { select: { id: true, title: true, status: true } } },
          orderBy: { appliedAt: "desc" },
        },
        interviews: { orderBy: { scheduledAt: "desc" } },
        offers: { orderBy: { createdAt: "desc" } },
        placements: {
          include: { job: { select: { id: true, title: true } } },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            applications: true,
            interviews: true,
            offers: true,
            placements: true,
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Error fetching candidate:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidate" },
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

    const existing = await prisma.candidate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = sanitizeObject(body);

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        firstName: data.firstName as string,
        lastName: data.lastName as string,
        email: data.email as string,
        phone: (data.phone as string) || null,
        currentTitle: (data.currentTitle as string) || null,
        currentCompany: (data.currentCompany as string) || null,
        location: (data.location as string) || null,
        status: data.status as
          | "NEW"
          | "SCREENING"
          | "INTERVIEWING"
          | "OFFERED"
          | "PLACED"
          | "REJECTED"
          | "WITHDRAWN"
          | undefined,
        skills: (data.skills as string[]) || undefined,
        experience: data.experience
          ? parseInt(String(data.experience))
          : null,
        expectedSalary: data.expectedSalary
          ? parseFloat(String(data.expectedSalary))
          : null,
        source: (data.source as string) || null,
        notes: (data.notes as string) || null,
      },
    });

    const userId = (auth.session!.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "updated candidate",
        entityType: "Candidate",
        entityId: candidate.id,
      },
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Error updating candidate:", error);
    return NextResponse.json(
      { error: "Failed to update candidate" },
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

    const existing = await prisma.candidate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    await prisma.candidate.delete({ where: { id } });

    const userId = (auth.session!.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "deleted a candidate",
        entityType: "Candidate",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return NextResponse.json(
      { error: "Failed to delete candidate" },
      { status: 500 }
    );
  }
}
