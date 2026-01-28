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

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      applications: { include: { job: true } },
      interviews: { orderBy: { scheduledAt: "desc" } },
      offers: { orderBy: { createdAt: "desc" } },
      placements: { include: { job: true } }
    }
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  return NextResponse.json(candidate);
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

    const candidate = await prisma.candidate.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        skills: data.skills,
        experience: data.experience ? parseInt(data.experience) : null,
        currentTitle: data.currentTitle,
        currentCompany: data.currentCompany,
        expectedSalary: data.expectedSalary ? parseFloat(data.expectedSalary) : null,
        location: data.location,
        status: data.status,
        score: data.score ? parseFloat(data.score) : null,
        notes: data.notes
      }
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Error updating candidate:", error);
    return NextResponse.json({ error: "Failed to update candidate" }, { status: 500 });
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
    await prisma.candidate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 });
  }
}
