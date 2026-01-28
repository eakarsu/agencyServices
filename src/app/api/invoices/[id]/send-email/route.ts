import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateInvoiceEmailHTML } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const { to, subject, message } = await request.json();

    // Get invoice details
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        items: true
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Send email with invoice details
    const html = generateInvoiceEmailHTML(invoice);

    await sendEmail({
      to,
      subject,
      text: message,
      html
    });

    // Update invoice status to SENT if it was DRAFT
    if (invoice.status === "DRAFT") {
      await prisma.invoice.update({
        where: { id },
        data: { status: "SENT" }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Invoice email sent successfully!"
    });
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return NextResponse.json(
      { error: "Failed to send invoice email" },
      { status: 500 }
    );
  }
}
