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

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        tasks: {
          include: { assignee: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        milestones: { orderBy: { dueDate: "asc" } },
        teamMembers: true,
        files: { orderBy: { uploadedAt: "desc" } },
        approvalWorkflows: {
          include: { requestedBy: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        timeEntries: {
          include: {
            user: { select: { name: true } },
            task: { select: { title: true } },
          },
          orderBy: { date: "desc" },
          take: 20,
        },
        _count: {
          select: {
            tasks: true,
            milestones: true,
            teamMembers: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
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

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = sanitizeObject(body);

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name as string,
        description: (data.description as string) || null,
        status: data.status as
          | "PLANNING"
          | "IN_PROGRESS"
          | "ON_HOLD"
          | "COMPLETED"
          | "CANCELLED"
          | undefined,
        budget: data.budget ? Number(data.budget) : null,
        startDate: data.startDate ? new Date(data.startDate as string) : null,
        endDate: data.endDate ? new Date(data.endDate as string) : null,
      },
    });

    const userId = (auth.session!.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "updated project",
        entityType: "Project",
        entityId: project.id,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
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

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    await prisma.project.delete({ where: { id } });

    const userId = (auth.session!.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "deleted a project",
        entityType: "Project",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
