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

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        contracts: true,
        billingInfo: true,
        projects: {
          include: { manager: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
        communications: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        campaigns: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            projects: true,
            invoices: true,
            campaigns: true,
            communications: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
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

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const body = await request.json();
    const data = sanitizeObject(body);

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name as string,
        email: data.email as string,
        phone: (data.phone as string) || null,
        company: (data.company as string) || null,
        website: (data.website as string) || null,
        address: (data.address as string) || null,
        industry: (data.industry as string) || null,
        status: data.status as
          | "ACTIVE"
          | "INACTIVE"
          | "PROSPECT"
          | "CHURNED"
          | undefined,
        notes: (data.notes as string) || null,
      },
    });

    const userId = (auth.session!.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "updated client",
        entityType: "Client",
        entityId: client.id,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
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

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.client.delete({ where: { id } });

    const userId = (auth.session!.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "deleted a client",
        entityType: "Client",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
