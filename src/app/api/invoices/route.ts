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
  const status = searchParams.get("status") || "";
  const clientId = searchParams.get("clientId") || "";

  const where = {
    ...(status && { status: status as "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" }),
    ...(clientId && { clientId })
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        client: { select: { name: true } },
        createdBy: { select: { name: true } },
        _count: { select: { items: true, payments: true } }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.invoice.count({ where })
  ]);

  return NextResponse.json({
    invoices,
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

    // Generate invoice number - find the highest existing number
    const allInvoices = await prisma.invoice.findMany({
      select: { invoiceNumber: true }
    });
    const maxNumber = allInvoices.reduce((max, inv) => {
      const num = parseInt(inv.invoiceNumber.replace("INV-", ""));
      return num > max ? num : max;
    }, 0);
    const invoiceNumber = `INV-${String(maxNumber + 1).padStart(5, "0")}`;

    // Calculate totals
    const items = data.items || [];
    const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + (item.quantity * item.unitPrice), 0);
    const tax = data.tax || 0;
    const total = subtotal + tax;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId,
        createdById: userId,
        type: data.type,
        status: data.status || "DRAFT",
        subtotal,
        tax,
        total,
        dueDate: new Date(data.dueDate),
        notes: data.notes,
        items: {
          create: items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice
          }))
        }
      },
      include: { items: true }
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
