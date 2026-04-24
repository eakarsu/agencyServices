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

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        client: { select: { id: true, name: true } },
        followUps: { orderBy: { scheduledAt: "desc" } },
        distributions: { orderBy: { assignedAt: "desc" } },
        _count: {
          select: {
            followUps: true,
            distributions: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
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

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = sanitizeObject(body);

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        firstName: data.firstName as string,
        lastName: data.lastName as string,
        email: data.email as string,
        phone: (data.phone as string) || null,
        company: (data.company as string) || null,
        title: (data.title as string) || null,
        source: data.source as
          | "WEBSITE"
          | "REFERRAL"
          | "COLD_CALL"
          | "EMAIL_CAMPAIGN"
          | "SOCIAL_MEDIA"
          | "AD_CAMPAIGN"
          | "EVENT"
          | "OTHER"
          | undefined,
        status: data.status as
          | "NEW"
          | "CONTACTED"
          | "QUALIFIED"
          | "UNQUALIFIED"
          | "CONVERTED"
          | "LOST"
          | undefined,
        score: data.score !== undefined ? Number(data.score) : undefined,
        notes: (data.notes as string) || null,
        convertedAt:
          data.status === "CONVERTED" && existing.status !== "CONVERTED"
            ? new Date()
            : undefined,
      },
    });

    const userId = (auth.session!.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "updated lead",
        entityType: "Lead",
        entityId: lead.id,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
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

    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await prisma.lead.delete({ where: { id } });

    const userId = (auth.session!.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "deleted a lead",
        entityType: "Lead",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
