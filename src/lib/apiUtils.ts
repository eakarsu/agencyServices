import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { checkRateLimit } from "./rateLimit";
import { sanitizeObject } from "./validation";

// Global error handler wrapper
export function withErrorHandler(
  handler: (req: NextRequest, ctx?: unknown) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx?: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      console.error(`API Error [${req.method} ${req.nextUrl.pathname}]:`, error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  };
}

// RBAC authorization check
export type UserRole = "ADMIN" | "MANAGER" | "MEMBER";

const roleHierarchy: Record<UserRole, number> = {
  ADMIN: 3,
  MANAGER: 2,
  MEMBER: 1,
};

export async function checkAuth(requiredRole?: UserRole) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { authorized: false, session: null, error: "Unauthorized", status: 401 };
  }

  const userRole = (session.user as { role: string }).role as UserRole;

  if (requiredRole && roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
    return {
      authorized: false,
      session,
      error: "Forbidden: insufficient permissions",
      status: 403,
    };
  }

  return { authorized: true, session, error: null, status: 200 };
}

// Rate limiting for API routes
export function applyRateLimit(req: NextRequest, maxRequests = 60) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const result = checkRateLimit(`${ip}:${req.nextUrl.pathname}`, {
    windowMs: 60 * 1000,
    maxRequests,
  });

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(maxRequests),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}

// Input sanitization middleware
export function sanitizeRequestBody<T extends Record<string, unknown>>(body: T): T {
  return sanitizeObject(body);
}

// Add security headers
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}
