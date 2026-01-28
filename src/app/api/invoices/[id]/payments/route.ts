import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount: parseFloat(data.amount),
        method: data.method,
        reference: data.reference
      }
    });

    // Check if invoice is fully paid
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true }
    });

    if (invoice) {
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid >= invoice.total) {
        await prisma.invoice.update({
          where: { id },
          data: { status: "PAID", paidAt: new Date() }
        });
      }
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
