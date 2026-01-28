import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true, email: true } },
      tasks: {
        include: { assignee: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" }
      },
      milestones: { orderBy: { dueDate: "asc" } },
      teamMembers: {
        include: { project: false }
      },
      files: { orderBy: { uploadedAt: "desc" } },
      approvalWorkflows: {
        include: { requestedBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" }
      },
      timeEntries: {
        include: { user: { select: { name: true } }, task: { select: { title: true } } },
        orderBy: { date: "desc" },
        take: 20
      }
    }
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await request.json();

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        managerId: data.managerId,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget ? parseFloat(data.budget) : null
      }
    });

    const userId = (session.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "updated project",
        entityType: "Project",
        entityId: project.id
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.project.delete({ where: { id } });

    const userId = (session.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "deleted a project",
        entityType: "Project",
        entityId: id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
