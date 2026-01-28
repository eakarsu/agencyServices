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

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      contracts: true,
      billingInfo: true,
      projects: {
        include: { manager: { select: { name: true } } },
        orderBy: { createdAt: "desc" }
      },
      communications: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
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

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        website: data.website,
        address: data.address,
        industry: data.industry,
        status: data.status,
        notes: data.notes
      }
    });

    const userId = (session.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "updated client",
        entityType: "Client",
        entityId: client.id
      }
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
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
    await prisma.client.delete({ where: { id } });

    const userId = (session.user as { id: string }).id;
    await prisma.activity.create({
      data: {
        userId,
        action: "deleted a client",
        entityType: "Client",
        entityId: id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
