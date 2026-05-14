// Bulk email campaign sender — uses existing nodemailer pipeline (Ethereal in dev,
// SMTP_USER/PASS in production). Templates substitute {{name}}, {{firstName}},
// {{company}} placeholders.
// PRODUCT-DECISION: throttle is 50 emails per request to avoid blocking event loop;
// override via env BULK_EMAIL_BATCH_SIZE.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

const BATCH_SIZE = Number(process.env.BULK_EMAIL_BATCH_SIZE || "50");

function fill(template: string, ctx: Record<string, any>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => String(ctx[key] ?? ""));
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { recipients, subjectTemplate, bodyTemplate } = await request.json();
    if (!Array.isArray(recipients) || !subjectTemplate || !bodyTemplate) {
      return NextResponse.json(
        { error: "recipients (array), subjectTemplate, bodyTemplate required" },
        { status: 400 }
      );
    }
    const limited = recipients.slice(0, BATCH_SIZE);
    const results: any[] = [];

    for (const r of limited) {
      const subject = fill(subjectTemplate, r);
      const body = fill(bodyTemplate, r);
      try {
        const result = await sendEmail({ to: r.email, subject, text: body });
        results.push({ to: r.email, ok: true, messageId: result.messageId });
      } catch (e: any) {
        results.push({ to: r.email, ok: false, error: e?.message || "send failed" });
      }
    }

    const summary = {
      total: limited.length,
      sent: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      truncated: recipients.length > BATCH_SIZE,
    };

    return NextResponse.json({ summary, results });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
