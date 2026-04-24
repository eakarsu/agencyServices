import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { registerSchema, sanitizeInput } from "@/lib/validation";
import { sendEmail } from "@/lib/email";
import { applyRateLimit } from "@/lib/apiUtils";

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 10);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();

    // Input validation with Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;
    const sanitizedName = sanitizeInput(name);

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: sanitizedName,
        role: "MEMBER",
        emailVerified: false,
        verifyToken,
        verifyTokenExp,
      }
    });

    // Send verification email
    const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/verify-email?token=${verifyToken}`;

    try {
      await sendEmail({
        to: email,
        subject: "Verify Your Email - Agency Services",
        text: `Welcome to Agency Services! Please verify your email by clicking: ${verifyUrl}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#4F46E5;color:white;padding:20px;text-align:center;">
              <h1>Welcome to Agency Services!</h1>
            </div>
            <div style="padding:20px;background:#f9f9f9;">
              <p>Hi ${sanitizedName},</p>
              <p>Please verify your email address by clicking the button below:</p>
              <div style="text-align:center;margin:30px 0;">
                <a href="${verifyUrl}" style="background:#4F46E5;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
                  Verify Email
                </a>
              </div>
              <p style="color:#666;font-size:14px;">This link expires in 24 hours.</p>
            </div>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      message: "Account created. Please check your email to verify your account."
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
