import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/apiUtils";

async function verifyToken(token: string) {
  const user = await prisma.user.findFirst({
    where: {
      verifyToken: token,
      verifyTokenExp: { gt: new Date() },
    },
  });

  if (!user) {
    return { success: false, error: "Invalid or expired verification token" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verifyToken: null,
      verifyTokenExp: null,
    },
  });

  return { success: true };
}

// Handle GET requests (clicking email verification link)
export async function GET(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 10);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      return NextResponse.redirect(`${baseUrl}/login?error=missing_token`);
    }

    const result = await verifyToken(token);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    if (!result.success) {
      return NextResponse.redirect(`${baseUrl}/login?error=invalid_token`);
    }

    return NextResponse.redirect(`${baseUrl}/login?verified=true`);
  } catch (error) {
    console.error("Email verification error:", error);
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/login?error=verification_failed`);
  }
}

// Handle POST requests (API-based verification)
export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 10);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const result = await verifyToken(token);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
