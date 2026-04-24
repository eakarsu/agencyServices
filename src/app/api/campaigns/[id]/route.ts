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

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
        channels: true,
        metrics: { orderBy: { date: "desc" }, take: 30 },
        abTests: { orderBy: { createdAt: "desc" } },
        _count: {
          select: {
            channels: true,
            metrics: true,
            abTests: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
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

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = sanitizeObject(body);

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        name: data.name as string,
        description: (data.description as string) || null,
        status: data.status as
          | "DRAFT"
          | "SCHEDULED"
          | "ACTIVE"
          | "PAUSED"
          | "COMPLETED"
          | undefined,
        type: data.type as
          | "EMAIL"
          | "SOCIAL"
          | "PPC"
          | "CONTENT"
          | "SEO"
          | "MULTI_CHANNEL"
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
        action: "updated campaign",
        entityType: "Campaign",
        entityId: campaign.id,
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
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

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    await prisma.campaign.delete({ where: { id } });

    const userId = (auth.session!.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "deleted a campaign",
        entityType: "Campaign",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
